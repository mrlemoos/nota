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

describe('NotaClerkSignIn auth flow', () => {
  it('keeps reset-password verification out of the default verifications step', () => {
    // Arrange
    const source = loadAuthComponentSource();
    const verificationsStep = extractSignInStep(source, 'verifications');

    // Act
    const containsResetPasswordStrategy = verificationsStep.includes(
      'reset_password_email_code',
    );

    // Assert
    expect(containsResetPasswordStrategy).toBe(false);
  });

  it('requires an explicit forgot-password action to enter reset-password flow', () => {
    // Arrange
    const source = loadAuthComponentSource();
    const passwordStrategyRegex =
      /<SignIn\.Strategy name="password">([\s\S]*?)<\/SignIn\.Strategy>/;
    const passwordStrategy = source.match(passwordStrategyRegex)?.[1] ?? '';
    const forgotPasswordStep = extractSignInStep(source, 'forgot-password');

    // Act
    const hasForgotPasswordAction = passwordStrategy.includes(
      'navigate="forgot-password"',
    );
    const forgotPasswordStepStartsReset = forgotPasswordStep.includes(
      '<SignIn.SupportedStrategy name="reset_password_email_code"',
    );

    // Assert
    expect(hasForgotPasswordAction).toBe(true);
    expect(forgotPasswordStepStartsReset).toBe(true);
  });
});
