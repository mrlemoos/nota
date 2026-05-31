import * as SecureStore from 'expo-secure-store';
import type { TokenCache } from '@clerk/expo/token-cache';

/**
 * Custom SecureStore-backed token cache for Clerk on mobile (iOS/Android keychain).
 * Follows @clerk/expo recommendations + the nota skill patterns.
 * Uses AFTER_FIRST_UNLOCK for accessibility (token unavailable until first device unlock after reboot).
 *
 * Never falls back to AsyncStorage (unencrypted).
 */
const TOKEN_CACHE_PREFIX = 'clerk-';

export const tokenCache: TokenCache = {
  async getToken(key: string): Promise<string | null> {
    const fullKey = `${TOKEN_CACHE_PREFIX}${key}`;
    try {
      return await SecureStore.getItemAsync(fullKey, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } catch (err) {
      // Corrupted or inaccessible entry: delete and surface null so Clerk can re-auth
      try {
        await SecureStore.deleteItemAsync(fullKey, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      } catch {
        // ignore secondary delete failure
      }
      return null;
    }
  },

  async saveToken(key: string, token: string): Promise<void> {
    const fullKey = `${TOKEN_CACHE_PREFIX}${key}`;
    try {
      await SecureStore.setItemAsync(fullKey, token, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    } catch {
      // Non-fatal: Clerk will keep token in memory for the session
    }
  },
};

export default tokenCache;
