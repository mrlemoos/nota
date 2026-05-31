import { useMobileSession } from '../lib/session-context';
import { Link, useRouter } from 'expo-router';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';

/**
 * Paywall shown to signed-in but non-entitled users.
 * Primary CTA: open web browser to subscribe (web checkout / pricing).
 * "Nota Pro required for full offline vault + sync on mobile."
 */
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
    // Drive to web app (adjust URL as needed; production will be nota.dev or similar)
    const webUrl = 'https://nota.dev';
    try {
      await WebBrowser.openBrowserAsync(webUrl);
    } catch {
      Alert.alert(
        'Could not open browser',
        'Visit https://nota.dev in Safari to subscribe to Nota Pro.',
      );
    }
  };

  const handleRefresh = async () => {
    const entitled = await refreshEntitlement();
    if (entitled) {
      // Success! Context + main layout will redirect automatically on re-render
      router.replace('/(main)');
    } else {
      Alert.alert(
        'Still not entitled',
        'Complete your subscription on the web, then tap "I subscribed" to re-check.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Nota Pro required</Text>

        <Text style={styles.body}>
          An active Nota Pro subscription is required to use the full offline
          vault and sync on iPhone.
        </Text>

        {user?.email && (
          <Text style={styles.email}>Signed in as {user.email}</Text>
        )}

        {entitlementError && (
          <Text style={styles.error}>Last check: {entitlementError}</Text>
        )}

        <Pressable
          style={[styles.primaryCta, isCheckingEntitlement && styles.disabled]}
          onPress={handleGoToWeb}
          disabled={isCheckingEntitlement}
        >
          <Text style={styles.primaryCtaText}>Subscribe on the web</Text>
        </Pressable>

        <Pressable
          style={[
            styles.secondaryCta,
            isCheckingEntitlement && styles.disabled,
          ]}
          onPress={handleRefresh}
          disabled={isCheckingEntitlement}
        >
          {isCheckingEntitlement ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={styles.secondaryCtaText}>
              I subscribed — Check again
            </Text>
          )}
        </Pressable>

        <Pressable style={styles.signOut} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.hint}>
          After subscribing on the web, return here and tap the check button
          above. Your mobile vault unlocks automatically.
        </Text>
      </View>

      <Link href="/(auth)/sign-in" style={styles.bottomLink}>
        <Text style={styles.bottomLinkText}>Use a different account</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
    textAlign: 'center',
  },
  email: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  error: {
    fontSize: 12,
    color: '#c33',
    textAlign: 'center',
  },
  primaryCta: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryCtaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryCta: {
    borderWidth: 1,
    borderColor: '#111',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryCtaText: { color: '#111', fontSize: 15, fontWeight: '500' },
  signOut: { alignItems: 'center', paddingVertical: 8 },
  signOutText: { color: '#c33', fontSize: 14 },
  hint: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  disabled: { opacity: 0.5 },
  bottomLink: { marginTop: 24, alignSelf: 'center' },
  bottomLinkText: { color: '#0066cc', fontSize: 14 },
});
