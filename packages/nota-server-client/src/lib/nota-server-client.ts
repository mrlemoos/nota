function normaliseBaseUrl(baseUrl: string | undefined): string | undefined {
  if (typeof baseUrl !== 'string' || !baseUrl.trim()) {
    return undefined;
  }
  return baseUrl.replace(/\/$/, '');
}

function unauthorizedEntitledResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Unauthorized', entitled: false }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

function unauthorizedInvalidateResponse(): Response {
  return new Response(JSON.stringify({ ok: false }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

function unauthorizedReleasesResponse(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized', releases: [] }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * `GET` on nota-server; Bearer Clerk session JWT.
 * Missing base URL or access token → 401 without calling the network.
 */
export async function fetchNotaProEntitled(
  baseUrl: string | undefined,
  accessToken: string | null | undefined,
): Promise<Response> {
  const base = normaliseBaseUrl(baseUrl);
  if (!base) {
    return unauthorizedEntitledResponse();
  }
  if (!accessToken) {
    return unauthorizedEntitledResponse();
  }
  return fetch(`${base}/api/nota-pro-entitled`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/**
 * `POST` on nota-server; same Bearer auth as {@link fetchNotaProEntitled}.
 */
export async function postNotaProInvalidate(
  baseUrl: string | undefined,
  accessToken: string | null | undefined,
): Promise<Response> {
  const base = normaliseBaseUrl(baseUrl);
  if (!base) {
    return unauthorizedInvalidateResponse();
  }
  if (!accessToken) {
    return unauthorizedInvalidateResponse();
  }
  return fetch(`${base}/api/nota-pro-invalidate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

function unauthorizedJsonResponse(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** `POST` semantic search; Bearer Clerk session JWT. Missing base URL or token → 401 without calling the network. */
export async function postSemanticSearch(
  baseUrl: string | undefined,
  accessToken: string | null | undefined,
  body: { query: string },
): Promise<Response> {
  const base = normaliseBaseUrl(baseUrl);
  if (!base) {
    return unauthorizedJsonResponse({ error: 'Unauthorized' });
  }
  if (!accessToken) {
    return unauthorizedJsonResponse({ error: 'Unauthorized' });
  }
  return fetch(`${base}/api/semantic-search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/** `POST` index one note for semantic search. */
export async function postSearchIndexNote(
  baseUrl: string | undefined,
  accessToken: string | null | undefined,
  body: { noteId: string },
): Promise<Response> {
  const base = normaliseBaseUrl(baseUrl);
  if (!base) {
    return unauthorizedJsonResponse({ error: 'Unauthorized' });
  }
  if (!accessToken) {
    return unauthorizedJsonResponse({ error: 'Unauthorized' });
  }
  return fetch(`${base}/api/search/index-note`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/** `POST` rebuild semantic index for all vault notes (Nota Pro). */
export async function postSearchReindexAll(
  baseUrl: string | undefined,
  accessToken: string | null | undefined,
): Promise<Response> {
  const base = normaliseBaseUrl(baseUrl);
  if (!base) {
    return unauthorizedJsonResponse({ error: 'Unauthorized' });
  }
  if (!accessToken) {
    return unauthorizedJsonResponse({ error: 'Unauthorized' });
  }
  return fetch(`${base}/api/search/reindex-all`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
}

/** `GET` recent release notes; Bearer Clerk session JWT. Missing base URL or token → 401 without calling the network. */
export async function fetchReleases(
  baseUrl: string | undefined,
  accessToken: string | null | undefined,
  limit = 5,
): Promise<Response> {
  const base = normaliseBaseUrl(baseUrl);
  if (!base) {
    return unauthorizedReleasesResponse();
  }
  if (!accessToken) {
    return unauthorizedReleasesResponse();
  }
  const safeLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(20, Math.trunc(limit)))
    : 5;
  const qs = new URLSearchParams({ limit: String(safeLimit) });
  return fetch(`${base}/api/releases?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
