import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function loadAuthComponentSource(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return readFileSync(resolve(thisDir, 'nota-clerk-elements-auth.tsx'), 'utf8');
}

function extractSignInStep(source: string, stepName: string): string {
  const escapedStepName = stepName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stepRegex = new RegExp(
    `<SignIn\\.Step name="${escapedStepName}">([\\s\\S]*?)<\\/SignIn\\.Step>`,
  );
  const match = source.match(stepRegex);
  return match?.[1] ?? '';
}

function extractStrategyBlock(source: string, strategyName: string): string {
  const escaped = strategyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `<SignIn\\.Strategy name="${escaped}">([\\s\\S]*?)<\\/SignIn\\.Strategy>`,
  );
  const match = source.match(re);
  return match?.[1] ?? '';
}

describe('NotaClerkSignIn auth flow', () => {
  it('keeps identifier-only start (no Strategy wrapper) and password in verifications', () => {
    // Arrange
    const source = loadAuthComponentSource();
    const startStep = extractSignInStep(source, 'start');
    const verificationsStep = extractSignInStep(source, 'verifications');

    // Act
    const hasStrategyInStart = startStep.includes('<SignIn.Strategy');
    const hasIdentifierInStart = startStep.includes(
      '<Clerk.Field name="identifier"',
    );
    const hasPasswordInStart = startStep.includes(
      '<Clerk.Field name="password"',
    );
    const hasContinueSubmit = startStep.includes('Continue');
    const hasPasswordStrategyInVerifications = verificationsStep.includes(
      '<SignIn.Strategy name="password">',
    );
    const hasPasswordFieldInVerifications = verificationsStep.includes(
      '<Clerk.Field name="password"',
    );
    const hasResetVerificationStrategy = verificationsStep.includes(
      '<SignIn.Strategy name="reset_password_email_code">',
    );
    const hasForgotPasswordAction = source.includes(
      'navigate="forgot-password"',
    );

    // Assert
    expect(hasStrategyInStart).toBe(false);
    expect(hasIdentifierInStart).toBe(true);
    expect(hasPasswordInStart).toBe(false);
    expect(hasContinueSubmit).toBe(true);
    expect(hasPasswordStrategyInVerifications).toBe(true);
    expect(hasPasswordFieldInVerifications).toBe(true);
    expect(hasResetVerificationStrategy).toBe(true);
    expect(hasForgotPasswordAction).toBe(true);
  });

  it('offers OTP escape hatches that only switch to password (no choose-strategy step)', () => {
    // Arrange
    const source = loadAuthComponentSource();
    const emailCodeBlock = extractStrategyBlock(source, 'email_code');
    const emailLinkBlock = extractStrategyBlock(source, 'email_link');

    // Act
    const hasChooseStrategyStep = source.includes(
      '<SignIn.Step name="choose-strategy">',
    );
    // Strategies use the auto-prefer component which renders SupportedStrategy internally.
    const emailCodeSwitchesToPassword = emailCodeBlock.includes(
      'SignInOtpStrategyAutoPreferPassword',
    );
    const emailLinkSwitchesToPassword = emailLinkBlock.includes(
      'SignInOtpStrategyAutoPreferPassword',
    );
    // The component definition must contain the actual SupportedStrategy switch.
    const otpComponentHasSupportedStrategy =
      source.includes('function SignInOtpStrategyAutoPreferPassword') &&
      source.includes('<SignIn.SupportedStrategy name="password"');

    // Assert
    expect(hasChooseStrategyStep).toBe(false);
    expect(emailCodeSwitchesToPassword).toBe(true);
    expect(emailLinkSwitchesToPassword).toBe(true);
    expect(otpComponentHasSupportedStrategy).toBe(true);
  });

  it('auto-prefers password for OTP or mistaken reset default; honours explicit reset intent', () => {
    // Arrange
    const source = loadAuthComponentSource();

    // Act
    const hasOtpStrategyAutoPreferPassword = source.includes(
      'SignInOtpStrategyAutoPreferPassword',
    );
    const callsInvalidPreparePassword =
      source.includes('prepareFirstFactor') &&
      source.includes("strategy: 'password'");
    const honoursExplicitReset = source.includes(
      'explicitPasswordResetRequest',
    );
    const marksExplicitReset = source.includes(
      'markNotaExplicitPasswordResetRequest',
    );
    const hasResetStrategyClick = source.includes(
      'SignInResetEmailCodeStrategyAutoPreferPassword',
    );
    const hasProgrammaticPasswordStrategyClick =
      source.includes('SignInSwitchToPasswordButton') &&
      source.includes('switchBtnRef');

    // Assert
    expect(hasOtpStrategyAutoPreferPassword).toBe(true);
    expect(callsInvalidPreparePassword).toBe(false);
    expect(honoursExplicitReset).toBe(true);
    expect(marksExplicitReset).toBe(true);
    expect(hasResetStrategyClick).toBe(true);
    expect(hasProgrammaticPasswordStrategyClick).toBe(true);
  });
});
