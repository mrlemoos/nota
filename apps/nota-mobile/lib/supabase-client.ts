import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@nota/database-types';

import { assertSupabaseEnv } from './config';

export type TypedSupabaseClient = SupabaseClient<Database>;

let client: TypedSupabaseClient | null = null;
let boundGetToken: (() => Promise<string | null>) | null = null;

export function resetSupabaseClient(): void {
  client = null;
  boundGetToken = null;
}

export function bindSupabaseAccessToken(
  getToken: () => Promise<string | null>,
): void {
  boundGetToken = getToken;
  client = null;
}

export function getSupabaseClient(): TypedSupabaseClient {
  if (!boundGetToken) {
    throw new Error('Supabase is not bound to the active session.');
  }
  if (!client) {
    const { url, anonKey } = assertSupabaseEnv();
    const getToken = boundGetToken;
    client = createClient<Database>(url, anonKey, {
      accessToken: () => getToken(),
    });
  }
  return client;
}
