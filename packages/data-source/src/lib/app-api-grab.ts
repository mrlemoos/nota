import grabkit from 'grabkit';

/**
 * Shared grabkit callable for the app's own same-origin `/api/*` routes (Clerk
 * session cookie auth, so nothing is attached here).
 *
 * `format: 'json'` because those routes are plain JSON, not JSON:API — the
 * default mode would demand a `type` field on every write body.
 *
 * Built lazily: grabkit rejects a relative URI unless a `baseURL` is set, and
 * reading `window.location.origin` at module scope would break the server
 * render of any client component that imports this.
 */
let grab: ReturnType<typeof grabkit> | null = null;

export function appApiGrab(): ReturnType<typeof grabkit> {
  grab ??= grabkit(window.location.origin, { format: 'json' });
  return grab;
}
