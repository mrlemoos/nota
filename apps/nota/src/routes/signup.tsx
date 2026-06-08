import { useAuth } from '@clerk/react';
import type { JSX } from 'react';
import { AuthScreenHashLink } from '@/components/auth-screen-hash-link';
import { AuthScreenShell } from '@/components/auth-screen-shell';
import { NotaClerkSignUp } from '@/components/nota-clerk-auth';
import { NotaLoadingStatus } from '@nota/web-design/spinner';

export default function Signup(): JSX.Element {
  const { isLoaded, userId } = useAuth();

  return (
    <AuthScreenShell
      footer={
        <>
          Already have an account?{' '}
          <AuthScreenHashLink target="login">Sign in</AuthScreenHashLink>
        </>
      }
    >
      {!isLoaded ? (
        <div className="py-8">
          <NotaLoadingStatus label="Loading…" spinnerSize="sm" />
        </div>
      ) : userId ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Opening Nota…
        </p>
      ) : (
        <NotaClerkSignUp />
      )}
    </AuthScreenShell>
  );
}
