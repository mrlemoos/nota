import { useSignIn, useSSO } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleEmailSignIn = async () => {
    if (!isLoaded || !signIn) return;

    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId });
        // Router will handle redirect via auth layout + session context
        router.replace('/(main)');
      } else {
        // Handle factors (2FA, etc.) - minimal v1 just alert
        Alert.alert(
          'Additional steps required',
          'Please complete verification in the web app for now.',
        );
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message ?? err?.message ?? 'Sign in failed';
      Alert.alert('Sign in error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!isLoaded) return;

    setOauthLoading(true);
    try {
      const { createdSessionId, setActive: setActiveFromSSO } =
        await startSSOFlow({
          strategy: 'oauth_google',
          redirectUrl: 'nota://oauth-callback',
        });

      if (createdSessionId) {
        await setActiveFromSSO!({ session: createdSessionId });
        router.replace('/(main)');
      }
      // If createdSessionId is null, Clerk will redirect to callback screen which completes it
    } catch (err: any) {
      const msg = err?.message ?? 'Google sign in failed';
      Alert.alert('OAuth error', msg);
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Sign in to Nota</Text>
        <Text style={styles.subtitle}>Your notes, everywhere.</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading && !oauthLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading && !oauthLoading}
          />

          <Pressable
            style={[
              styles.primaryButton,
              (loading || !isLoaded) && styles.disabled,
            ]}
            onPress={handleEmailSignIn}
            disabled={loading || !isLoaded || oauthLoading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign in</Text>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={[styles.socialButton, oauthLoading && styles.disabled]}
            onPress={handleGoogle}
            disabled={oauthLoading || loading}
          >
            {oauthLoading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/sign-up" style={styles.link}>
            <Text style={styles.linkText}>Sign up</Text>
          </Link>
        </View>

        <Text style={styles.hint}>
          Nota Pro (full sync + offline vault) requires an active subscription.
          Sign up on the web to subscribe.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: { gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  primaryButton: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { color: '#888', fontSize: 13 },
  socialButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  socialButtonText: { fontSize: 16, fontWeight: '500' },
  disabled: { opacity: 0.6 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: '#666' },
  link: { marginLeft: 4 },
  linkText: { color: '#0066cc', fontWeight: '500' },
  hint: {
    marginTop: 40,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
});
