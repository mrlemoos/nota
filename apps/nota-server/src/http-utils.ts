import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

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
