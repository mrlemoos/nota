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

  it('uses a choose-strategy step for SupportedStrategy per the Clerk Elements API contract', () => {
    // Arrange
    const source = loadAuthComponentSource();
    const chooseStrategyStep = extractSignInStep(source, 'choose-strategy');
    const emailCodeBlock = extractStrategyBlock(source, 'email_code');
    const emailLinkBlock = extractStrategyBlock(source, 'email_link');

    // The choose-strategy step must exist — SupportedStrategy only works there
    // because STRATEGY.UPDATE is only handled by the XState inner machine in
    // ChooseStrategy state, not in Pending.
    const hasChooseStrategyStep = source.includes(
      '<SignIn.Step name="choose-strategy">',
    );
    // The choose-strategy step delegates to the auto-select component
    const chooseStepUsesAutoSelect = chooseStrategyStep.includes(
      'SignInChooseStrategyAutoSelectPassword',
    );
    // The auto-select component definition contains SupportedStrategy(password).
    // name="password" is on a separate line in multiline JSX, so check both
    // the component definition and the strategy attribute independently.
    const autoSelectComponentHasSupportedStrategy =
      source.includes('function SignInChooseStrategyAutoSelectPassword') &&
      source.includes('<SignIn.SupportedStrategy') &&
      /SignInChooseStrategyAutoSelectPassword[\s\S]*?name="password"/.test(
        source,
      );
    // SupportedStrategy(password) does NOT appear directly in verifications strategy blocks
    const supportedStrategyInEmailCode = emailCodeBlock.includes(
      '<SignIn.SupportedStrategy name="password"',
    );
    const supportedStrategyInEmailLink = emailLinkBlock.includes(
      '<SignIn.SupportedStrategy name="password"',
    );
    // OTP strategy blocks navigate to choose-strategy (single XState event, documented API)
    const emailCodeNavigatesToChooseStrategy = emailCodeBlock.includes(
      'SignInOtpStrategyAutoPreferPassword',
    );
    const emailLinkNavigatesToChooseStrategy = emailLinkBlock.includes(
      'SignInOtpStrategyAutoPreferPassword',
    );
    // No two-hidden-button hack component
    const hasHiddenButtonHack = source.includes('SignInSwitchToPasswordButton');

    // Assert
    expect(hasChooseStrategyStep).toBe(true);
    expect(chooseStepUsesAutoSelect).toBe(true);
    expect(autoSelectComponentHasSupportedStrategy).toBe(true);
    expect(supportedStrategyInEmailCode).toBe(false);
    expect(supportedStrategyInEmailLink).toBe(false);
    expect(emailCodeNavigatesToChooseStrategy).toBe(true);
    expect(emailLinkNavigatesToChooseStrategy).toBe(true);
    expect(hasHiddenButtonHack).toBe(false);
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
    // Auto-prefer navigates to choose-strategy (single event), not a two-step hidden-button click
    const autoPreferUsesNavigateToChooseStrategy =
      source.includes('navigate="choose-strategy"') &&
      source.includes('navigateBtnRef');

    // Assert
    expect(hasOtpStrategyAutoPreferPassword).toBe(true);
    expect(callsInvalidPreparePassword).toBe(false);
    expect(honoursExplicitReset).toBe(true);
    expect(marksExplicitReset).toBe(true);
    expect(hasResetStrategyClick).toBe(true);
    expect(autoPreferUsesNavigateToChooseStrategy).toBe(true);
  });
});
