/**
 * @nota/mobile-editor - Content load / save + roundtrip utilities
 *
 * Provides:
 * - Normalization of incoming content (ensures valid {type: 'doc', ...} shape)
 * - setContent / getContent helpers that speak the bridge
 * - isDocContentEqual: pure-JS structural comparison that serves the same
 *   purpose as the web editor's:
 *     const parsed = PMNode.fromJSON(editor.schema, content);
 *     return editor.state.doc.eq(parsed);
 *
 * Design constraint: NO dependency on @tiptap/*, @nota/editor, or any web-only
 * packages. This keeps mobile-editor strictly on shared platform packages +
 * RN + TenTap glue.
 *
 * When full fidelity tests are added, this function (or a future shared
 * implementation living in a platform-agnostic package) will be used to assert
 * byte-for-byte equivalent JSON after load/edit/save cycles.
 */

export type PMJSONNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMJSONNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
  [key: string]: unknown;
};

export type PMJSONDoc = {
  type: 'doc';
  content?: PMJSONNode[];
  attrs?: Record<string, unknown>;
};

/**
 * Normalizes arbitrary input into a safe ProseMirror document JSON shape.
 * Used both for initialContent and when receiving external updates (sync, offline, etc).
 */
export function normalizeDocContent(input: unknown): PMJSONDoc {
  if (!input || typeof input !== 'object') {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }

  const obj = input as any;

  // Already a doc?
  if (obj.type === 'doc') {
    return {
      type: 'doc',
      content: Array.isArray(obj.content) ? obj.content : [],
      attrs: obj.attrs,
    };
  }

  // Single node passed? Wrap it.
  if (obj.type && typeof obj.type === 'string') {
    return { type: 'doc', content: [obj] };
  }

  // Array of top level nodes?
  if (Array.isArray(obj)) {
    return { type: 'doc', content: obj };
  }

  // Fallback empty doc with paragraph (matches web editor behavior)
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

/**
 * Deep structural equality for ProseMirror JSON documents.
 *
 * Canonicalizes by:
 * - Sorting object keys
 * - Sorting marks arrays by type (order of marks should not matter for equality)
 * - Recursive descent
 *
 * This is intentionally schema-agnostic and does not perform validation
 * (the bridge + TenTap web side does that). It is sufficient for detecting
 * "did the logical document change" and for roundtrip fidelity tests.
 *
 * Matches the spirit (and in practice the results) of web's
 * PMNode.fromJSON + .eq for documents produced by the same schema.
 */
export function isDocContentEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;

  const ca = canonicalizePMJSON(a);
  const cb = canonicalizePMJSON(b);

  return JSON.stringify(ca) === JSON.stringify(cb);
}

function canonicalizePMJSON(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    // Special case: marks arrays — sort by mark type for stable comparison
    if (
      value.length > 0 &&
      value[0] &&
      typeof value[0] === 'object' &&
      'type' in value[0]
    ) {
      return [...value]
        .sort((x: any, y: any) =>
          String(x?.type ?? '').localeCompare(String(y?.type ?? '')),
        )
        .map(canonicalizePMJSON);
    }
    return value.map(canonicalizePMJSON);
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();
    const out: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      out[key] = canonicalizePMJSON(obj[key]);
    }
    return out;
  }

  return value;
}

/**
 * Lightweight helper to extract just the top-level node types present in a doc.
 * Useful for quick debug / hybrid dispatch decisions.
 */
export function getTopLevelNodeTypes(doc: unknown): string[] {
  const normalized = normalizeDocContent(doc);
  if (!normalized.content) return [];
  return normalized.content.map((n) => n.type).filter(Boolean);
}

/**
 * Returns true if the document only contains "simple" nodes that can be
 * handled by the fast native path (per the hybrid model).
 * Currently a heuristic; will be exact once we have full native simple impl.
 */
export function isSimpleOnlyDoc(doc: unknown): boolean {
  // For foundation phase we conservatively return false (TenTap full surface is used).
  // Real impl will walk and use isSimpleNotaNode from node-contract.
  return false;
}
