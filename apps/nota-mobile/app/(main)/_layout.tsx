import { useMobileSession } from '../../lib/session-context';
import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

/**
 * Protected layout for entitled (Nota Pro) users.
 * - Requires sign in
 * - Requires notaProEntitled === true (otherwise redirects to /paywall)
 * - Provides the full offline vault + sync experience (future: notes list, editor, sync)
 */
export default function MainProtectedLayout() {
  const {
    isLoaded,
    isSignedIn,
    notaProEntitled,
    isCheckingEntitlement,
    entitlementError,
    refreshEntitlement,
  } = useMobileSession();

  if (!isLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Still determining entitlement on launch or after refresh
  if (isCheckingEntitlement || notaProEntitled === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.statusText}>Checking your Nota Pro status…</Text>
      </View>
    );
  }

  if (notaProEntitled === false) {
    // Non-entitled signed-in user → paywall (drive to web checkout)
    return <Redirect href="/paywall" />;
  }

  // Entitled user: full app
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Nota' }} />
      <Stack.Screen name="notes/[id]" options={{ title: 'Note' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#555',
  },
});
