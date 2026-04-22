import { describe, expect, it } from 'vitest';
import {
  DEV_PORT,
  normalisedPackagedAppOrigin,
  PACKAGED_REMOTE_APP_ORIGIN,
  resolveMainWindowLoadUrl,
  ssoCallbackBaseUrl,
} from './app-load-url.js';

describe('app-load-url', () => {
  it('normalises packaged remote origin without trailing slash', () => {
    // Arrange
    // (module exports DEV_PORT, PACKAGED_REMOTE_APP_ORIGIN, normalisedPackagedAppOrigin)

    // Act
    const originEndsWithSlash = PACKAGED_REMOTE_APP_ORIGIN.endsWith('/');
    const normalised = normalisedPackagedAppOrigin();

    // Assert
    expect(originEndsWithSlash).toBe(false);
    expect(normalised).toBe('https://app.nota.mrlemoos.dev');
  });

  it('resolveMainWindowLoadUrl uses local Vite port in dev and hosted URL when packaged', () => {
    // Arrange
    const isDevTrue = true;
    const isDevFalse = false;

    // Act
    const devUrl = resolveMainWindowLoadUrl(isDevTrue);
    const prodUrl = resolveMainWindowLoadUrl(isDevFalse);

    // Assert
    expect(devUrl).toBe(`http://localhost:${DEV_PORT}`);
    expect(prodUrl).toBe('https://app.nota.mrlemoos.dev/');
  });

  it('ssoCallbackBaseUrl matches load URL host without trailing slash for packaged', () => {
    // Arrange
    const isDevTrue = true;
    const isDevFalse = false;

    // Act
    const devBase = ssoCallbackBaseUrl(isDevTrue);
    const prodBase = ssoCallbackBaseUrl(isDevFalse);

    // Assert
    expect(devBase).toBe(`http://localhost:${DEV_PORT}`);
    expect(prodBase).toBe('https://app.nota.mrlemoos.dev');
  });
});
