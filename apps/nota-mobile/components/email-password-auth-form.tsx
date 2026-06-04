import { useAuth } from '@clerk/expo';
import { useSignIn, useSignUp } from '@clerk/expo/legacy';
import { loginSchema, signupSchema } from '@nota/validation';
import { Link, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { clerkApiErrorMessage } from '../lib/clerk-api-error-message';
import { colors, sharedStyles, spacing, typography } from '../lib/theme';

export type EmailPasswordAuthMode = 'signIn' | 'signUp';

export interface EmailPasswordAuthFormProps {
  mode: EmailPasswordAuthMode;
  alternateHref: Href;
  alternatePrompt: string;
  alternateLabel: string;
}

type Step = 'credentials' | 'verification';

export function EmailPasswordAuthForm({
  mode,
  alternateHref,
  alternatePrompt,
  alternateLabel,
}: EmailPasswordAuthFormProps) {
  const { isLoaded: authLoaded } = useAuth();
  const {
    isLoaded: signInLoaded,
    signIn,
    setActive: setSignInActive,
  } = useSignIn();
  const {
    isLoaded: signUpLoaded,
    signUp,
    setActive: setSignUpActive,
  } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('credentials');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ready = authLoaded && (mode === 'signIn' ? signInLoaded : signUpLoaded);

  const completeSignIn = useCallback(async () => {
    if (!signIn?.status || !setSignInActive) return;

    if (signIn.status === 'complete' && signIn.createdSessionId) {
      await setSignInActive({ session: signIn.createdSessionId });
      return;
    }

    if (
      signIn.status === 'needs_second_factor' ||
      signIn.status === 'needs_client_trust'
    ) {
      await signIn.prepareSecondFactor({ strategy: 'email_code' });
      setStep('verification');
      setMessage('Enter the verification code we sent to your email.');
      return;
    }

    if (signIn.status === 'needs_first_factor') {
      const emailFactor = signIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code',
      );
      if (emailFactor && 'emailAddressId' in emailFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailFactor.emailAddressId,
        });
        setStep('verification');
        setMessage('Enter the verification code we sent to your email.');
        return;
      }
    }

    setMessage(
      'Additional verification is required. Check your email or try again in a moment.',
    );
  }, [setSignInActive, signIn]);

  const completeSignUp = useCallback(async () => {
    if (!signUp?.status || !setSignUpActive) return;

    if (signUp.status === 'complete' && signUp.createdSessionId) {
      await setSignUpActive({ session: signUp.createdSessionId });
      return;
    }

    if (
      signUp.status === 'missing_requirements' &&
      signUp.unverifiedFields.includes('email_address')
    ) {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verification');
      setMessage('Enter the verification code we sent to your email.');
      return;
    }

    setMessage('Could not finish creating your account. Try again.');
  }, [setSignUpActive, signUp]);

  const submitCredentials = useCallback(async () => {
    setMessage(null);

    if (mode === 'signIn') {
      const parsed = loginSchema.safeParse({ email: email.trim(), password });
      if (!parsed.success) {
        setMessage(parsed.error.issues[0]?.message ?? 'Check your details.');
        return;
      }
      if (!signIn || !setSignInActive) return;

      setLoading(true);
      try {
        await signIn.create({
          identifier: parsed.data.email,
          password: parsed.data.password,
        });
        await completeSignIn();
      } catch (error) {
        setMessage(clerkApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
      return;
    }

    const parsed = signupSchema.safeParse({
      email: email.trim(),
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setMessage(parsed.error.issues[0]?.message ?? 'Check your details.');
      return;
    }
    if (!signUp || !setSignUpActive) return;

    setLoading(true);
    try {
      await signUp.create({
        emailAddress: parsed.data.email,
        password: parsed.data.password,
      });
      await completeSignUp();
    } catch (error) {
      setMessage(clerkApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [
    completeSignIn,
    completeSignUp,
    confirmPassword,
    email,
    mode,
    password,
    setSignInActive,
    setSignUpActive,
    signIn,
    signUp,
  ]);

  const submitVerification = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setMessage('Enter the verification code.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signIn') {
        if (!signIn || !setSignInActive) return;

        if (
          signIn.status === 'needs_second_factor' ||
          signIn.status === 'needs_client_trust'
        ) {
          await signIn.attemptSecondFactor({
            strategy: 'email_code',
            code: trimmed,
          });
        } else {
          await signIn.attemptFirstFactor({
            strategy: 'email_code',
            code: trimmed,
          });
        }
        await completeSignIn();
        return;
      }

      if (!signUp || !setSignUpActive) return;
      await signUp.attemptEmailAddressVerification({ code: trimmed });
      await completeSignUp();
    } catch (error) {
      setMessage(clerkApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [
    code,
    completeSignIn,
    completeSignUp,
    mode,
    setSignInActive,
    setSignUpActive,
    signIn,
    signUp,
  ]);

  const onSubmit = () => {
    if (step === 'verification') {
      void submitVerification();
    } else {
      void submitCredentials();
    }
  };

  const title = mode === 'signUp' ? 'Create your account' : 'Sign in to Nota';
  const primaryLabel =
    step === 'verification'
      ? 'Verify'
      : mode === 'signUp'
        ? 'Create account'
        : 'Sign in';

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{title}</Text>

        {step === 'credentials' ? (
          <>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              editable={!loading}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              secureTextEntry
              autoComplete={mode === 'signUp' ? 'new-password' : 'password'}
              textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              editable={!loading}
            />

            {mode === 'signUp' ? (
              <>
                <Text style={styles.label}>Confirm password</Text>
                <TextInput
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  editable={!loading}
                />
              </>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              We sent a code to {email.trim() || 'your email'}.
            </Text>
            <Text style={styles.label}>Verification code</Text>
            <TextInput
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              value={code}
              onChangeText={setCode}
              style={styles.input}
              editable={!loading}
            />
            <Pressable
              onPress={() => {
                setStep('credentials');
                setCode('');
                setMessage(null);
              }}
              disabled={loading}
            >
              <Text style={styles.linkText}>Use a different email</Text>
            </Pressable>
          </>
        )}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable
          style={[sharedStyles.primaryButton, loading && sharedStyles.disabled]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={sharedStyles.primaryButtonText}>{primaryLabel}</Text>
          )}
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{alternatePrompt} </Text>
        <Link href={alternateHref} style={styles.link}>
          <Text style={styles.linkText}>{alternateLabel}</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    ...typography.heading,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginTop: spacing.sm,
  },
  input: {
    ...sharedStyles.input,
  },
  message: {
    color: colors.destructive,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  footerText: { ...typography.caption },
  link: { marginLeft: 4 },
  linkText: { color: colors.link, fontSize: 15, fontWeight: '500' },
});
