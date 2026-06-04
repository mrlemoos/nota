/**
 * User-facing message from a Clerk API error (or generic fallback).
 */
export function clerkApiErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'errors' in error &&
    Array.isArray(error.errors)
  ) {
    const errors = (
      error as { errors: Array<{ longMessage?: string; message?: string }> }
    ).errors;
    if (errors.length === 0) {
      return 'Something went wrong. Try again.';
    }
    const first = errors[0];
    if (first.longMessage) return first.longMessage;
    if (first.message) return first.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Something went wrong. Try again.';
}
