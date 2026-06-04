import { useMobileSession } from '../../lib/session-context';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../../lib/theme';

/**
 * Protected layout for entitled (Nota Pro) users.
 */
export default function MainProtectedLayout() {
  const { isLoaded, isSignedIn, notaProEntitled, isCheckingEntitlement } =
    useMobileSession();

  if (!isLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (isCheckingEntitlement || notaProEntitled === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.statusText}>Checking your subscription…</Text>
      </View>
    );
  }

  if (!notaProEntitled) {
    return <Redirect href="/paywall" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="notes/[id]" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
    gap: 12,
  },
  statusText: {
    ...typography.caption,
    fontSize: 14,
  },
});
