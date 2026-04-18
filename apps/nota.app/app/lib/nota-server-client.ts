import {
  fetchNotaProEntitled as fetchNotaProEntitledRequest,
  postNotaProInvalidate as postNotaProInvalidateRequest,
} from '@nota.app/nota-server-client';
import { getClerkAccessToken } from './clerk-token-ref';

function notaServerBase(): string | undefined {
  const b = import.meta.env.VITE_NOTA_SERVER_API_URL;
  if (typeof b !== 'string' || !b.trim()) {
    return undefined;
  }
  return b.replace(/\/$/, '');
}

/** `GET` on nota-server; Bearer Clerk session JWT. Missing `VITE_NOTA_SERVER_API_URL` → 401 without calling the network. */
export async function fetchNotaProEntitled(): Promise<Response> {
  return fetchNotaProEntitledRequest(
    notaServerBase(),
    await getClerkAccessToken(),
  );
}

/** `POST` on nota-server; same Bearer auth as `fetchNotaProEntitled`. */
export async function postNotaProInvalidate(): Promise<Response> {
  return postNotaProInvalidateRequest(
    notaServerBase(),
    await getClerkAccessToken(),
  );
}
