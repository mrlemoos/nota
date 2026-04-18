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
