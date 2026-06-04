import { EmailPasswordAuthForm } from '../../components/email-password-auth-form';

export default function SignUpScreen() {
  return (
    <EmailPasswordAuthForm
      mode="signUp"
      alternateHref="/(auth)/sign-in"
      alternatePrompt="Already have an account?"
      alternateLabel="Sign in"
    />
  );
}
