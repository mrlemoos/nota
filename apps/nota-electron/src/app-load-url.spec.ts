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
    expect(PACKAGED_REMOTE_APP_ORIGIN.endsWith('/')).toBe(false);
    expect(normalisedPackagedAppOrigin()).toBe('https://app.nota.mrlemoos.dev');
  });

  it('resolveMainWindowLoadUrl uses local Vite port in dev and hosted URL when packaged', () => {
    expect(resolveMainWindowLoadUrl(true)).toBe(`http://localhost:${DEV_PORT}`);
    expect(resolveMainWindowLoadUrl(false)).toBe('https://app.nota.mrlemoos.dev/');
  });

  it('ssoCallbackBaseUrl matches load URL host without trailing slash for packaged', () => {
    expect(ssoCallbackBaseUrl(true)).toBe(`http://localhost:${DEV_PORT}`);
    expect(ssoCallbackBaseUrl(false)).toBe('https://app.nota.mrlemoos.dev');
  });
});
