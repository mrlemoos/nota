import type { GrabkitError, GrabkitTransportError } from 'grabkit';

/**
 * HTTP status behind a failed grab, or `0` for a transport failure (network
 * error, abort, unparseable body) where no status reached us.
 *
 * Discriminates on `name`, **not** grabkit's `isGrabHttpError`: in grabkit 2.1.0
 * the error classes are downlevelled to ES5, so `Error.call(this)` hands back a
 * fresh Error and the instance never gets the subclass prototype — every
 * `instanceof` (and therefore `isGrabHttpError`) is false. `name` is a literal
 * type on both classes, so it narrows and it survives the downlevel.
 */
export function grabErrorStatus(
  error: GrabkitError | GrabkitTransportError,
): number {
  return error.name === 'GrabkitError' ? error.statusCode : 0;
}

/** Parsed error body from a failed grab, or `null` on a transport failure. */
export function grabErrorBody(
  error: GrabkitError | GrabkitTransportError,
): unknown {
  return error.name === 'GrabkitError' ? error.body : null;
}
