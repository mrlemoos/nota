import { SignIn, SignUp } from '@clerk/react';
import type { JSX } from 'react';
import {
  clerkFullNotesUrl,
  clerkFullSignInUrl,
  clerkFullSignUpUrl,
} from '@/lib/clerk-hash-navigation';

/**
 * Prebuilt Clerk `<SignIn />` / `<SignUp />` (Core 3 `@clerk/react`) with hash routing for this SPA.
 */
export function NotaClerkSignIn(): JSX.Element {
  return (
    <SignIn
      routing="hash"
      signInUrl={clerkFullSignInUrl()}
      signUpUrl={clerkFullSignUpUrl()}
      forceRedirectUrl={clerkFullNotesUrl()}
      signUpForceRedirectUrl={clerkFullNotesUrl()}
      fallback={
        <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
      }
    />
  );
}

export function NotaClerkSignUp(): JSX.Element {
  return (
    <SignUp
      routing="hash"
      signInUrl={clerkFullSignInUrl()}
      signUpUrl={clerkFullSignUpUrl()}
      forceRedirectUrl={clerkFullNotesUrl()}
      signInForceRedirectUrl={clerkFullNotesUrl()}
      fallback={
        <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
      }
    />
  );
}
