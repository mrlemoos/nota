/**
 * User-facing message from a Clerk API error (or generic fallback).
 */
export function clerkApiErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'errors' in error &&
    Array.isArray((error as { errors: unknown }).errors)
  ) {
    const first = (
      error as { errors: Array<{ longMessage?: string; message?: string }> }
    ).errors[0];
    if (first?.longMessage) return first.longMessage;
    if (first?.message) return first.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Something went wrong. Try again.';
}
