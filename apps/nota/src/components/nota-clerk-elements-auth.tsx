import * as Clerk from '@clerk/elements/common';
import * as SignIn from '@clerk/elements/sign-in';
import * as SignUp from '@clerk/elements/sign-up';
import { useClerk } from '@clerk/react';
import { type JSX, useEffect, useLayoutEffect, useRef } from 'react';

import { notaButtonVariants } from '@nota/web-design/button';
import { NotaLoadingStatus } from '@nota/web-design/spinner';
import { cn } from '@/lib/utils';

/**
 * Clerk can default `needs_first_factor` to `reset_password_email_code` when both
 * password and reset are supported — wrong for normal sign-in. Only honour reset
 * after the user explicitly taps "Send reset code" on the forgot-password step.
 */
const notaSignInPasswordPreferGate = {
  explicitPasswordResetRequest: false,
  /** Dedupes programmatic navigate-to-choose-strategy clicks across remounts (e.g. StrictMode). */
  lastAutoPasswordStrategyClickSignInId: null as string | null,
};

function markNotaExplicitPasswordResetRequest(): void {
  notaSignInPasswordPreferGate.explicitPasswordResetRequest = true;
  notaSignInPasswordPreferGate.lastAutoPasswordStrategyClickSignInId = null;
}

function clearNotaSignInPasswordResetIntent(): void {
  notaSignInPasswordPreferGate.explicitPasswordResetRequest = false;
  notaSignInPasswordPreferGate.lastAutoPasswordStrategyClickSignInId = null;
}

const fieldGroupClass = 'flex flex-col gap-2';
const labelClass = 'text-sm font-medium leading-none text-foreground';
const inputClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';
const primarySubmitClass = cn(
  notaButtonVariants({ variant: 'default', size: 'lg', className: 'w-full' }),
);
/** Vertical rhythm inside each Clerk step (fields + actions). */
const stepStackClass = 'flex flex-col gap-4';
const rootStackClass = 'flex flex-col gap-6';

/**
 * `STRATEGY.UPDATE` is only handled by the Clerk Elements XState inner machine in
 * `ChooseStrategy` state — in `Pending` it is silently dropped. `<SignIn.SupportedStrategy>`
 * must therefore be placed inside `<SignIn.Step name="choose-strategy">`, which is only
 * active when the outer router is in `ChoosingStrategy` sub-state.
 *
 * This component lives inside that step and auto-selects the password strategy via
 * `useLayoutEffect` so the transition fires before the browser paints.
 */
function SignInChooseStrategyAutoSelectPassword(): JSX.Element | null {
  const passwordBtnRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    passwordBtnRef.current?.click();
  }, []);

  return (
    <SignIn.SupportedStrategy name="password" asChild>
      <button
        type="button"
        ref={passwordBtnRef}
        aria-hidden
        style={{ display: 'none' }}
        tabIndex={-1}
      >
        Use password instead
      </button>
    </SignIn.SupportedStrategy>
  );
}

/**
 * Clerk Elements applies first-factor switches via `STRATEGY.UPDATE` (SupportedStrategy),
 * not reliably via `client.signIn.prepareFirstFactor` from outside that flow. When the
 * reset-email-code strategy is shown without explicit forgot-password intent, navigate to
 * the choose-strategy step once per sign-in id. The choose-strategy step then
 * auto-selects password via {@link SignInChooseStrategyAutoSelectPassword}.
 */
function SignInResetEmailCodeStrategyAutoPreferPassword(): JSX.Element {
  const clerk = useClerk();
  const navigateBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sid = clerk.client?.signIn?.id ?? '';
    if (!sid) return;

    if (notaSignInPasswordPreferGate.explicitPasswordResetRequest) {
      return;
    }

    if (
      notaSignInPasswordPreferGate.lastAutoPasswordStrategyClickSignInId === sid
    ) {
      return;
    }
    notaSignInPasswordPreferGate.lastAutoPasswordStrategyClickSignInId = sid;

    queueMicrotask(() => {
      navigateBtnRef.current?.click();
    });
  }, [clerk.client?.signIn?.id]);

  return (
    <div className="flex flex-col gap-3 border-b border-border/50 pb-4">
      <p className="text-sm text-muted-foreground">
        Nota signs you in with a password. If you see a reset code instead, use
        the button below.
      </p>
      <SignIn.Action
        navigate="choose-strategy"
        ref={navigateBtnRef}
        className={cn(
          notaButtonVariants({
            variant: 'outline',
            className: 'w-full',
          }),
        )}
      >
        Use password instead
      </SignIn.Action>
    </div>
  );
}

/**
 * Auto-navigate from OTP strategy (email_code / email_link) to the choose-strategy step
 * once per sign-in id. The choose-strategy step then auto-selects password via
 * {@link SignInChooseStrategyAutoSelectPassword}.
 */
function SignInOtpStrategyAutoPreferPassword(): JSX.Element {
  const clerk = useClerk();
  const navigateBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sid = clerk.client?.signIn?.id ?? '';
    if (!sid) return;
    if (
      notaSignInPasswordPreferGate.lastAutoPasswordStrategyClickSignInId === sid
    ) {
      return;
    }
    notaSignInPasswordPreferGate.lastAutoPasswordStrategyClickSignInId = sid;
    queueMicrotask(() => {
      navigateBtnRef.current?.click();
    });
  }, [clerk.client?.signIn?.id]);

  return (
    <SignIn.Action
      navigate="choose-strategy"
      ref={navigateBtnRef}
      className={cn(
        notaButtonVariants({
          variant: 'outline',
          className: 'w-full',
        }),
      )}
    >
      Use password instead
    </SignIn.Action>
  );
}

const authFallback = (
  <div className="py-6">
    <NotaLoadingStatus label="Loading…" spinnerSize="sm" />
  </div>
);

/**
 * Composable Clerk Elements flows with `routing="hash"` for the Nota Vite SPA.
 * Email/password (and verification steps) per dashboard-enabled strategies.
 */
export function NotaClerkSignIn(): JSX.Element {
  return (
    <SignIn.Root path="/sign-in" routing="hash" fallback={authFallback}>
      <div className={rootStackClass}>
        <Clerk.GlobalError className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" />

        <SignIn.Step name="start">
          <div className={stepStackClass}>
            {/*
             * Do not wrap `start` fields in SignIn.Strategy: strategy UI requires
             * StrategiesContext from the verifications / first-factor subtree only.
             * A password strategy here renders nothing (default ctx isActive is always false).
             */}
            <Clerk.Field name="identifier" className={fieldGroupClass}>
              <Clerk.Label className={labelClass}>Email</Clerk.Label>
              <Clerk.Input
                type="email"
                className={inputClass}
                autoComplete="email"
                autoCapitalize="none"
              />
              <Clerk.FieldError className="text-sm text-destructive" />
            </Clerk.Field>

            <SignIn.Action submit className={primarySubmitClass}>
              Continue
            </SignIn.Action>
          </div>
        </SignIn.Step>

        <SignIn.Step name="verifications">
          <div className={stepStackClass}>
            {/*
             * When the Clerk instance prefers OTP (email code / link), the first factor can be
             * `email_code` or `email_link` before password. Render thin escape hatches so users can
             * switch to password without a full OTP sign-in path (Nota is email + password only).
             */}
            <SignIn.Strategy name="email_code">
              <div className={stepStackClass}>
                <p className="text-sm text-muted-foreground">
                  Nota signs you in with a password. If Clerk opened email
                  verification instead, use the button below.
                </p>
                <SignInOtpStrategyAutoPreferPassword />
              </div>
            </SignIn.Strategy>

            <SignIn.Strategy name="email_link">
              <div className={stepStackClass}>
                <p className="text-sm text-muted-foreground">
                  Nota signs you in with a password. If an email link was
                  offered instead, use the button below.
                </p>
                <SignInOtpStrategyAutoPreferPassword />
              </div>
            </SignIn.Strategy>

            <SignIn.Strategy name="password">
              <div className={stepStackClass}>
                <Clerk.Field name="password" className={fieldGroupClass}>
                  <Clerk.Label className={labelClass}>Password</Clerk.Label>
                  <Clerk.Input
                    type="password"
                    className={inputClass}
                    autoComplete="current-password"
                  />
                  <Clerk.FieldError className="text-sm text-destructive" />
                </Clerk.Field>
                <SignIn.Action submit className={primarySubmitClass}>
                  Sign in
                </SignIn.Action>
                <SignIn.Action
                  navigate="forgot-password"
                  className={cn(
                    notaButtonVariants({
                      variant: 'ghost',
                      className: 'w-full',
                    }),
                  )}
                >
                  Forgot password?
                </SignIn.Action>
              </div>
            </SignIn.Strategy>

            <SignIn.Strategy name="reset_password_email_code">
              <div className={stepStackClass}>
                <SignInResetEmailCodeStrategyAutoPreferPassword />
                <p className="text-sm text-muted-foreground">
                  We sent a code to <SignIn.SafeIdentifier />.
                </p>
                <Clerk.Field name="code" className={fieldGroupClass}>
                  <Clerk.Label className={labelClass}>
                    Verification code
                  </Clerk.Label>
                  <Clerk.Input type="otp" className={inputClass} />
                  <Clerk.FieldError className="text-sm text-destructive" />
                </Clerk.Field>
                <div className="flex flex-col gap-3">
                  <SignIn.Action submit className={primarySubmitClass}>
                    Continue
                  </SignIn.Action>
                  <SignIn.Action
                    resend
                    className={cn(
                      notaButtonVariants({
                        variant: 'ghost',
                        size: 'default',
                        className: 'w-full',
                      }),
                    )}
                  >
                    Resend code
                  </SignIn.Action>
                </div>
              </div>
            </SignIn.Strategy>
          </div>
        </SignIn.Step>

        {/*
         * `STRATEGY.UPDATE` is only handled in the inner machine's `ChooseStrategy` state.
         * `<SignIn.SupportedStrategy>` must live here — inside choose-strategy — where the
         * XState machine accepts the event. Auto-select password via useLayoutEffect so the
         * transition fires before the browser paints.
         */}
        <SignIn.Step name="choose-strategy">
          <SignInChooseStrategyAutoSelectPassword />
        </SignIn.Step>

        <SignIn.Step name="forgot-password">
          <div className={stepStackClass}>
            <p className="text-sm text-muted-foreground">
              We&apos;ll send a verification code to your email so you can reset
              your password.
            </p>
            <SignIn.SupportedStrategy name="reset_password_email_code" asChild>
              <button
                type="button"
                className={cn(
                  notaButtonVariants({
                    variant: 'outline',
                    className: 'w-full',
                  }),
                )}
                onPointerDown={markNotaExplicitPasswordResetRequest}
              >
                Send reset code
              </button>
            </SignIn.SupportedStrategy>
            <SignIn.Action
              navigate="start"
              className={cn(
                notaButtonVariants({ variant: 'ghost', className: 'w-full' }),
              )}
              onClick={clearNotaSignInPasswordResetIntent}
            >
              Back
            </SignIn.Action>
          </div>
        </SignIn.Step>

        <SignIn.Step name="reset-password">
          <div className={stepStackClass}>
            <Clerk.Field name="password" className={fieldGroupClass}>
              <Clerk.Label className={labelClass}>New password</Clerk.Label>
              <Clerk.Input
                type="password"
                className={inputClass}
                autoComplete="new-password"
              />
              <Clerk.FieldError className="text-sm text-destructive" />
            </Clerk.Field>
            <SignIn.Action submit className={primarySubmitClass}>
              Save password
            </SignIn.Action>
          </div>
        </SignIn.Step>

        <SignIn.Step name="sso-callback">
          <SignIn.Captcha />
        </SignIn.Step>
      </div>
    </SignIn.Root>
  );
}

export function NotaClerkSignUp(): JSX.Element {
  return (
    <SignUp.Root path="/sign-up" routing="hash" fallback={authFallback}>
      <div className={rootStackClass}>
        <Clerk.GlobalError className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" />

        <SignUp.Step name="start">
          <div className={stepStackClass}>
            <Clerk.Field name="emailAddress" className={fieldGroupClass}>
              <Clerk.Label className={labelClass}>Email</Clerk.Label>
              <Clerk.Input
                type="email"
                className={inputClass}
                autoComplete="email"
                autoCapitalize="none"
              />
              <Clerk.FieldError className="text-sm text-destructive" />
            </Clerk.Field>

            <Clerk.Field name="password" className={fieldGroupClass}>
              <Clerk.Label className={labelClass}>Password</Clerk.Label>
              <Clerk.Input
                type="password"
                className={inputClass}
                autoComplete="new-password"
              />
              <Clerk.FieldError className="text-sm text-destructive" />
            </Clerk.Field>

            <SignUp.Action submit className={primarySubmitClass}>
              Continue
            </SignUp.Action>
          </div>
        </SignUp.Step>

        <SignUp.Step name="continue">
          <div className={stepStackClass}>
            <Clerk.Field name="firstName" className={fieldGroupClass}>
              <Clerk.Label className={labelClass}>First name</Clerk.Label>
              <Clerk.Input
                type="text"
                className={inputClass}
                autoComplete="given-name"
              />
              <Clerk.FieldError className="text-sm text-destructive" />
            </Clerk.Field>
            <Clerk.Field name="lastName" className={fieldGroupClass}>
              <Clerk.Label className={labelClass}>Last name</Clerk.Label>
              <Clerk.Input
                type="text"
                className={inputClass}
                autoComplete="family-name"
              />
              <Clerk.FieldError className="text-sm text-destructive" />
            </Clerk.Field>
            <SignUp.Action submit className={primarySubmitClass}>
              Continue
            </SignUp.Action>
          </div>
        </SignUp.Step>

        <SignUp.Step name="verifications">
          <SignUp.Strategy name="email_code">
            <div className={stepStackClass}>
              <p className="text-sm text-muted-foreground">
                We sent a code to your email.
              </p>
              <Clerk.Field name="code" className={fieldGroupClass}>
                <Clerk.Label className={labelClass}>
                  Verification code
                </Clerk.Label>
                <Clerk.Input type="otp" className={inputClass} />
                <Clerk.FieldError className="text-sm text-destructive" />
              </Clerk.Field>
              <div className="flex flex-col gap-3">
                <SignUp.Action submit className={primarySubmitClass}>
                  Verify
                </SignUp.Action>
                <SignUp.Action
                  resend
                  className={cn(
                    notaButtonVariants({
                      variant: 'ghost',
                      size: 'default',
                      className: 'w-full',
                    }),
                  )}
                >
                  Resend code
                </SignUp.Action>
              </div>
            </div>
          </SignUp.Strategy>
        </SignUp.Step>
      </div>
    </SignUp.Root>
  );
}
