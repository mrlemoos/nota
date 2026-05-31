import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';

/**
 * Clerk OAuth callback target for deep links.
 * URL: nota://oauth-callback
 *
 * MUST call maybeCompleteAuthSession() at TOP LEVEL (module scope) — not in effect.
 * The session completion is handled by Clerk + expo-web-browser.
 */
WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallback() {
  const router = useRouter();

  // Optional: after a short delay, if still here push to a safe screen.
  // The Clerk hooks in sign-in screen + auth layout normally take over via setActive.
  useEffect(() => {
    const t = setTimeout(() => {
      // Fallback navigation; session state will drive real redirect via layouts
      router.replace('/(auth)/sign-in');
    }, 1200);

    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>Completing sign in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 16,
  },
  text: { color: '#666', fontSize: 14 },
});
