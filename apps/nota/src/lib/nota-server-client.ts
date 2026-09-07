/*
 * App API client. All endpoints are now served same-origin by the Next App
 * Router (`src/app/api/*`, absorbed from the former nota-server). Authenticated
 * routes use the Clerk session cookie via `clerkMiddleware` (see `proxy.ts`), so
 * no Bearer token is attached here.
 *
 * Transport is grabkit (`appApiGrab`): HTTP and network failures come back in the
 * result tuple instead of a `Response`, so these functions return parsed values.
 */

import { appApiGrab } from '@getmadrid/data-source/app-api-grab';
import { grabErrorStatus } from '@getmadrid/data-source/grab-error';

/**
 * `GET /api/nota-pro-entitled` — Clerk cookie auth. Throws on 401 (signed out)
 * or any other failure, which is what the vault loader uses to fall back to the
 * cached offline session.
 */
export async function fetchNotaProEntitled(): Promise<boolean> {
  const [json, error] = await appApiGrab()<{ entitled?: boolean }>(
    'GET /api/nota-pro-entitled',
  );
  if (error) {
    throw new Error(
      `Entitlement fetch failed: ${String(grabErrorStatus(error))}`,
    );
  }
  return json.entitled === true;
}

/**
 * `POST /api/nota-pro-invalidate` — drop the caller's cached entitlement.
 * Best-effort: failures are swallowed because the caller refreshes the vault
 * straight after, and that refresh is what surfaces a real problem.
 */
export async function postNotaProInvalidate(): Promise<void> {
  await appApiGrab()('POST /api/nota-pro-invalidate');
}
