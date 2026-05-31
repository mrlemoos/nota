import { useSignUp, useSSO } from '@clerk/expo';
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

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleEmailSignUp = async () => {
    if (!isLoaded || !signUp) return;

    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      // In minimal flow we complete if possible; many instances require email verification.
      // For full experience, users may need to verify via link (or finish on web).
      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId });
        router.replace('/(main)');
      } else if (result.status === 'missing_requirements') {
        // Common: email verification needed. Prompt user.
        Alert.alert(
          'Verify your email',
          'Check your inbox for a verification link from Clerk. You can also complete signup on the web.',
        );
        // Still allow proceeding if session created in background for some flows
        if (result.createdSessionId) {
          await setActive!({ session: result.createdSessionId });
        }
      } else {
        Alert.alert(
          'Sign up status',
          `Status: ${result.status}. Complete any required steps.`,
        );
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message ?? err?.message ?? 'Sign up failed';
      Alert.alert('Sign up error', msg);
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
    } catch (err: any) {
      const msg = err?.message ?? 'Google sign up failed';
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
        <Text style={styles.title}>Create your Nota account</Text>
        <Text style={styles.subtitle}>Write. Sync. Offline on iPhone.</Text>

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
            placeholder="Password (min 8 chars)"
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
            onPress={handleEmailSignUp}
            disabled={loading || !isLoaded || oauthLoading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create account</Text>
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
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" style={styles.link}>
            <Text style={styles.linkText}>Sign in</Text>
          </Link>
        </View>

        <Text style={styles.hint}>
          After signing up, subscribe to Nota Pro on the web to unlock the full
          offline vault and sync on mobile.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: {
    fontSize: 26,
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
