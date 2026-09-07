/**
 * Semantic search uses **OpenAI-compatible** `POST /v1/embeddings`.
 *
 * xAI does not document a public standalone embeddings endpoint for pushing vectors
 * into your own database (their Collections product embeds documents on their side).
 * Use any provider with the same request/response shape (OpenAI, Voyage, many hosts).
 */

import grabkit from 'grabkit';
import {
  grabErrorBody,
  grabErrorStatus,
} from '@getmadrid/data-source/grab-error';

const DEFAULT_BASE = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'text-embedding-3-small';

export function embeddingDimensionsExpected(): number {
  const raw = process.env.NOTA_SEMANTIC_EMBEDDINGS_DIMENSIONS?.trim();
  if (!raw) {
    return 1536;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(
      'nota-server: NOTA_SEMANTIC_EMBEDDINGS_DIMENSIONS must be a positive integer',
    );
  }
  return n;
}

export function embeddingModel(): string {
  const m = process.env.NOTA_SEMANTIC_EMBEDDINGS_MODEL?.trim();
  return m && m.length > 0 ? m : DEFAULT_MODEL;
}

function requireEmbeddingsApiKey(): string {
  const k = process.env.NOTA_SEMANTIC_EMBEDDINGS_API_KEY?.trim();
  if (!k) {
    throw new Error(
      'nota-server: set NOTA_SEMANTIC_EMBEDDINGS_API_KEY for semantic search (OpenAI-compatible embeddings API)',
    );
  }
  return k;
}

function embeddingsBaseUrl(): string {
  const raw = process.env.NOTA_SEMANTIC_EMBEDDINGS_API_BASE?.trim();
  const b = raw && raw.length > 0 ? raw : DEFAULT_BASE;
  return b.replace(/\/$/, '');
}

/**
 * Per-upstream grabkit factory, built on first use so the base URL is read from
 * the environment at runtime rather than at import. Plain JSON, not JSON:API.
 */
let embeddingsGrab: ReturnType<typeof grabkit> | null = null;

function embeddings(): ReturnType<typeof grabkit> {
  embeddingsGrab ??= grabkit(embeddingsBaseUrl(), { format: 'json' });
  return embeddingsGrab;
}

/** OpenAI-compatible embeddings response shape. */
type EmbeddingsOk = {
  data: Array<{ embedding: number[]; index?: number }>;
};

export async function embedTextsForSemanticSearch(
  inputs: string[],
): Promise<number[][]> {
  if (inputs.length === 0) {
    return [];
  }

  const model = embeddingModel();
  const apiKey = requireEmbeddingsApiKey();
  const expectedDim = embeddingDimensionsExpected();

  const [json, error] = await embeddings()<
    EmbeddingsOk,
    { model: string; input: string[] }
  >('POST /embeddings', {
    body: { model, input: inputs },
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (error) {
    const status = String(grabErrorStatus(error));
    const detail = JSON.stringify(grabErrorBody(error)) || error.message;
    throw new Error(`semantic embeddings failed: ${status} ${detail}`);
  }

  const rows = [...(json.data ?? [])].sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  );
  const vectors = rows.map((r) => r.embedding);

  for (const v of vectors) {
    if (v.length !== expectedDim) {
      throw new Error(
        `nota-server: embedding length ${v.length} does not match NOTA_SEMANTIC_EMBEDDINGS_DIMENSIONS=${expectedDim}; align migration vector(N) and env.`,
      );
    }
  }

  return vectors;
}

export async function embedTextForSemanticSearch(
  text: string,
): Promise<number[]> {
  const [v] = await embedTextsForSemanticSearch([text]);
  if (!v) {
    throw new Error('nota-server: empty embedding response');
  }
  return v;
}
