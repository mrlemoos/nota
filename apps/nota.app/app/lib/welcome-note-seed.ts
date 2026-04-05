import type { User } from '@supabase/supabase-js';
import { createLocalOnlyNote } from './notes-offline';
import { getBrowserClient } from './supabase/browser';
import { WELCOME_NOTE_CONTENT, WELCOME_NOTE_TITLE } from './welcome-note-doc';

/**
 * One promise per user for the welcome seed. Kept after settle so Strict Mode
 * (unmount/remount) cannot start a second `createLocalOnlyNote` while React
 * still shows `notesCount === 0` and stale `user_metadata`.
 */
const welcomeSeedByUserId = new Map<string, Promise<string | null>>();

/** Vitest-only: clears the per-tab seed cache between tests. */
export function clearWelcomeSeedCacheForTests(): void {
  welcomeSeedByUserId.clear();
}

export type WelcomeNoteSeedArgs = {
  user: User;
  notesCount: number;
};

/**
 * Ensures a one-time welcome note exists for accounts with an empty vault.
 *
 * Idempotent via `user.user_metadata.welcome_seeded` (synced with Supabase).
 * Legacy accounts with zero notes will also receive this note once — acceptable
 * unless a stricter gate (e.g. `created_at` cutoff) is added later.
 */
export async function runWelcomeNoteSeedIfNeeded(
  args: WelcomeNoteSeedArgs,
): Promise<string | null> {
  const { user, notesCount } = args;

  if (user.user_metadata?.welcome_seeded === true) {
    return null;
  }
  if (notesCount > 0) {
    return null;
  }

  const key = user.id;
  const existing = welcomeSeedByUserId.get(key);
  if (existing) {
    return existing;
  }

  const promise = (async (): Promise<string | null> => {
    try {
      const id = await createLocalOnlyNote(
        user.id,
        WELCOME_NOTE_TITLE,
        WELCOME_NOTE_CONTENT,
      );
      const { error } = await getBrowserClient().auth.updateUser({
        data: { welcome_seeded: true },
      });
      if (error) {
        console.error('Welcome note: failed to set user metadata', error);
      }
      return id;
    } catch (e) {
      console.error('Welcome note seed failed', e);
      welcomeSeedByUserId.delete(key);
      return null;
    }
  })();

  welcomeSeedByUserId.set(key, promise);
  return promise;
}
