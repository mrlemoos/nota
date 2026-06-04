import { useMobileSession } from '../lib/session-context';
import { WEB_APP_URL } from '../lib/config';
import { Link, useRouter } from 'expo-router';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

import { colors, sharedStyles, spacing, typography } from '../lib/theme';

export default function PaywallScreen() {
  const {
    user,
    isCheckingEntitlement,
    entitlementError,
    refreshEntitlement,
    signOut,
  } = useMobileSession();
  const router = useRouter();

  const handleGoToWeb = async () => {
    try {
      await WebBrowser.openBrowserAsync(WEB_APP_URL);
    } catch {
      Alert.alert(
        'Could not open browser',
        `Visit ${WEB_APP_URL} in Safari to subscribe to Nota Pro.`,
      );
    }
  };

  const handleRefresh = async () => {
    const entitled = await refreshEntitlement();
    if (entitled) {
      router.replace('/(main)');
    } else {
      Alert.alert(
        'Subscription not found',
        'Complete checkout on the web, then tap “Check again”.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Nota Pro required</Text>

        <Text style={styles.body}>
          An active Nota Pro subscription unlocks your notes on iPhone — the
          same vault as the web app, with sync.
        </Text>

        {user?.email ? (
          <Text style={styles.email}>Signed in as {user.email}</Text>
        ) : null}

        {entitlementError ? (
          <Text style={styles.error}>{entitlementError}</Text>
        ) : null}

        <Pressable
          style={[
            sharedStyles.primaryButton,
            isCheckingEntitlement && sharedStyles.disabled,
          ]}
          onPress={() => void handleGoToWeb()}
          disabled={isCheckingEntitlement}
        >
          <Text style={sharedStyles.primaryButtonText}>
            Subscribe on the web
          </Text>
        </Pressable>

        <Pressable
          style={[
            sharedStyles.secondaryButton,
            isCheckingEntitlement && sharedStyles.disabled,
          ]}
          onPress={() => void handleRefresh()}
          disabled={isCheckingEntitlement}
        >
          {isCheckingEntitlement ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={sharedStyles.secondaryButtonText}>Check again</Text>
          )}
        </Pressable>

        <Pressable style={styles.signOut} onPress={() => void signOut()}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <Link href="/(auth)/sign-in" style={styles.bottomLink}>
        <Text style={styles.bottomLinkText}>Use a different account</Text>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.heading,
    fontSize: 22,
    textAlign: 'center',
  },
  body: {
    ...typography.caption,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  email: {
    ...typography.caption,
    textAlign: 'center',
  },
  error: {
    fontSize: 13,
    color: colors.destructive,
    textAlign: 'center',
    lineHeight: 18,
  },
  signOut: { alignItems: 'center', paddingVertical: spacing.sm },
  signOutText: { color: colors.destructive, fontSize: 14 },
  bottomLink: { marginTop: spacing.lg, alignSelf: 'center' },
  bottomLinkText: { color: colors.link, fontSize: 14 },
});
