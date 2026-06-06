import { isClerkFapiHostname } from './clerk-fapi-cors.js';

/**
 * Clerk sign-in / IdP flows opened via `window.open` need a non-sandboxed child window
 * (WebAuthn, CAPTCHA). Ordinary link-preview and external note links should not use it.
 */
export function shouldOpenInAppOAuthPopupWindow(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return false;
    }
    const h = u.hostname.toLowerCase();
    if (h.endsWith('.accounts.dev')) {
      return true;
    }
    if (isClerkFapiHostname(h)) {
      return true;
    }
    return (
      h === 'accounts.google.com' ||
      h === 'appleid.apple.com' ||
      h === 'id.apple.com'
    );
  } catch {
    return false;
  }
}

export function shouldOpenHttpUrlInSystemBrowser(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
