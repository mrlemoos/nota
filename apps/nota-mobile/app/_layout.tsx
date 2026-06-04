import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '../lib/token-cache';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { NotaFontsGate } from '../components/nota-fonts-gate';
import { MobileSessionProvider } from '../lib/session-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Call at top-level module scope for OAuth session completion (per Clerk + Expo patterns)
WebBrowser.maybeCompleteAuthSession();

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (
  !clerkPublishableKey ||
  typeof clerkPublishableKey !== 'string' ||
  !clerkPublishableKey.trim()
) {
  // Fail fast like the web app (prevents opaque auth bugs in production builds)
  throw new Error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add it to .env (or EAS env) as EXPO_PUBLIC_*',
  );
}

/**
 * Root layout for Nota mobile.
 * - ClerkProvider + custom SecureStore tokenCache (survives restarts)
 * - Expo Router deep linking (nota://oauth-callback, nota://notes/:uuid)
 * - MobileSessionProvider wires entitlement checks via @nota/nota-server-client on sign-in
 */
export default function RootLayout() {
  // Extra safety: ensure browser auth session is completed if redirect lands here
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <SafeAreaProvider>
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        tokenCache={tokenCache}
      >
        <MobileSessionProvider>
          <NotaFontsGate>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(main)" />
              <Stack.Screen name="oauth-callback" />
              <Stack.Screen name="paywall" />
            </Stack>
          </NotaFontsGate>
        </MobileSessionProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
