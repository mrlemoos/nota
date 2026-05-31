import { useMobileSession } from '../../lib/session-context';
import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Auth group layout: only for unauthenticated users.
 * Redirects signed-in users to the main app (or paywall depending on entitlement).
 */
export default function AuthLayout() {
  const { isLoaded, isSignedIn, notaProEntitled, isCheckingEntitlement } =
    useMobileSession();

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isSignedIn) {
    // Already signed in: send to appropriate destination based on entitlement state
    if (isCheckingEntitlement || notaProEntitled === null) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    // Entitled → main vault; otherwise paywall
    return <Redirect href={notaProEntitled ? '/(main)' : '/paywall'} />;
  }

  return (
    <Stack screenOptions={{ headerShown: true, title: 'Nota' }}>
      <Stack.Screen name="sign-in" options={{ title: 'Sign In' }} />
      <Stack.Screen name="sign-up" options={{ title: 'Sign Up' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
