import { describe, expect, it } from 'vitest';
import {
  isNotaClerkSsoCallbackPathname,
  NOTA_CLERK_OAUTH_CALLBACK_URL,
  NOTA_CLERK_SSO_CALLBACK_PATH,
  NOTA_CUSTOM_SCHEME_URL_PREFIX,
} from './clerk-oauth-protocol.js';

describe('clerk-oauth-protocol', () => {
  it('uses a stable custom-scheme callback for Clerk redirect allowlisting', () => {
    // Arrange
    // (asserting exported protocol constants)

    // Act
    const exported = {
      callbackUrl: NOTA_CLERK_OAUTH_CALLBACK_URL,
      schemePrefix: NOTA_CUSTOM_SCHEME_URL_PREFIX,
      ssoPath: NOTA_CLERK_SSO_CALLBACK_PATH,
    };

    // Assert
    expect(exported.callbackUrl).toBe('nota://oauth-callback');
    expect(exported.schemePrefix).toBe('nota://');
    expect(exported.ssoPath).toBe('/sso-callback');
  });

  it('recognises the SPA pathname used for AuthenticateWithRedirectCallback', () => {
    // Arrange
    const exact = '/sso-callback';
    const withTrailingSlash = '/sso-callback/';
    const other = '/notes';

    // Act
    const exactResult = isNotaClerkSsoCallbackPathname(exact);
    const slashResult = isNotaClerkSsoCallbackPathname(withTrailingSlash);
    const otherResult = isNotaClerkSsoCallbackPathname(other);

    // Assert
    expect(exactResult).toBe(true);
    expect(slashResult).toBe(true);
    expect(otherResult).toBe(false);
  });
});
