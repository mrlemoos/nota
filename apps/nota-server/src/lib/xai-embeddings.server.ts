const DEFAULT_BASE = 'https://api.x.ai/v1';

export function embeddingDimensionsExpected(): number {
  const raw = process.env.XAI_EMBEDDING_DIMENSIONS?.trim();
  if (!raw) {
    return 1536;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('nota-server: XAI_EMBEDDING_DIMENSIONS must be a positive integer');
  }
  return n;
}

export function embeddingModel(): string | null {
  const m = process.env.XAI_EMBEDDING_MODEL?.trim();
  return m && m.length > 0 ? m : null;
}

function requireXaiKey(): string {
  const k = process.env.XAI_API_KEY?.trim();
  if (!k) {
    throw new Error('nota-server: set XAI_API_KEY for embeddings');
  }
  return k;
}

function embedBaseUrl(): string {
  const raw = process.env.XAI_API_BASE?.trim();
  const b = raw && raw.length > 0 ? raw : DEFAULT_BASE;
  return b.replace(/\/$/, '');
}

/** OpenAI-compatible embeddings response shape. */
type EmbeddingsOk = {
  data: Array<{ embedding: number[]; index?: number }>;
};

/**
 * Embed one or more input strings via xAI `POST /v1/embeddings` (Grok embedding model).
 */
export async function embedTextsWithXai(inputs: string[]): Promise<number[][]> {
  const model = embeddingModel();
  if (!model) {
    throw new Error(
      'nota-server: set XAI_EMBEDDING_MODEL for semantic search (xAI Grok embeddings model id)',
    );
  }
  if (inputs.length === 0) {
    return [];
  }

  const apiKey = requireXaiKey();
  const expectedDim = embeddingDimensionsExpected();

  const res = await fetch(`${embedBaseUrl()}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, input: inputs }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`xAI embeddings failed: ${res.status} ${errText}`);
  }

  const json = (await res.json()) as EmbeddingsOk;
  const rows = [...(json.data ?? [])].sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  );
  const vectors = rows.map((r) => r.embedding);

  for (const v of vectors) {
    if (v.length !== expectedDim) {
      throw new Error(
        `nota-server: embedding length ${v.length} does not match XAI_EMBEDDING_DIMENSIONS=${expectedDim}; align migration vector(N) and env.`,
      );
    }
  }

  return vectors;
}

export async function embedTextWithXai(text: string): Promise<number[]> {
  const [v] = await embedTextsWithXai([text]);
  if (!v) {
    throw new Error('nota-server: empty embedding response');
  }
  return v;
}
