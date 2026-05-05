import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';

export function expressToWebRequest(req: ExpressRequest): Request {
  const host = req.headers.host ?? 'localhost';
  const url = new URL(req.originalUrl || req.url || '/', `http://${host}`);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) {
      continue;
    }
    if (Array.isArray(v)) {
      for (const x of v) {
        headers.append(k, x);
      }
    } else {
      headers.set(k, v);
    }
  }
  return new Request(url.toString(), { method: req.method, headers });
}

/** Same as {@link expressToWebRequest}, but attaches `req.body` as JSON for handlers that call `request.json()`. */
export function expressToWebRequestWithJsonBody(req: ExpressRequest): Request {
  const base = expressToWebRequest(req);
  const bodyPayload = (
    req as ExpressRequest & { body?: Record<string, unknown> }
  ).body;
  return new Request(base.url, {
    method: base.method,
    headers: base.headers,
    body: JSON.stringify(bodyPayload ?? {}),
  });
}

export async function sendWebResponse(
  res: ExpressResponse,
  r: Response,
): Promise<void> {
  res.status(r.status);
  r.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const buf = Buffer.from(await r.arrayBuffer());
  res.end(buf);
}
