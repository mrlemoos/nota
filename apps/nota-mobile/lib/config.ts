/** Public web app URL for checkout / marketing (paywall opens in browser). */
export const WEB_APP_URL =
  process.env.EXPO_PUBLIC_WEB_APP_URL?.trim() || 'https://nota.dev';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export function assertSupabaseEnv(): { url: string; anonKey: string } {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local.',
    );
  }
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}
