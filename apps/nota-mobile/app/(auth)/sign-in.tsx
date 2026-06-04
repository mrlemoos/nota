import { EmailPasswordAuthForm } from '../../components/email-password-auth-form';

export default function SignInScreen() {
  return (
    <EmailPasswordAuthForm
      mode="signIn"
      alternateHref="/(auth)/sign-up"
      alternatePrompt="Don't have an account?"
      alternateLabel="Sign up"
    />
  );
}
