import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import {
  clearWelcomeSeedCacheForTests,
  runWelcomeNoteSeedIfNeeded,
} from './welcome-note-seed';
import { createLocalOnlyNote } from './notes-offline';
import { WELCOME_NOTE_CONTENT, WELCOME_NOTE_TITLE } from './welcome-note-doc';

const updateUser = vi.fn();

vi.mock('./supabase/browser', () => ({
  getBrowserClient: () => ({
    auth: { updateUser },
  }),
}));

vi.mock('./notes-offline', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./notes-offline')>();
  return {
    ...actual,
    createLocalOnlyNote: vi.fn(() => Promise.resolve('welcome-note-id')),
  };
});

function makeUser(overrides: Partial<User['user_metadata']> = {}): User {
  return {
    id: 'user-1',
    app_metadata: {},
    user_metadata: overrides,
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User;
}

describe('runWelcomeNoteSeedIfNeeded', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateUser.mockResolvedValue({ data: { user: {} }, error: null });
  });

  afterEach(() => {
    clearWelcomeSeedCacheForTests();
  });

  it('returns null when welcome_seeded is already true', async () => {
    const user = makeUser({ welcome_seeded: true });
    await expect(
      runWelcomeNoteSeedIfNeeded({ user, notesCount: 0 }),
    ).resolves.toBeNull();
    expect(createLocalOnlyNote).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('returns null when the vault already has notes', async () => {
    const user = makeUser({});
    await expect(
      runWelcomeNoteSeedIfNeeded({ user, notesCount: 3 }),
    ).resolves.toBeNull();
    expect(createLocalOnlyNote).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('creates the welcome note and sets user_metadata when the vault is empty', async () => {
    const user = makeUser({});
    await expect(
      runWelcomeNoteSeedIfNeeded({ user, notesCount: 0 }),
    ).resolves.toBe('welcome-note-id');

    expect(createLocalOnlyNote).toHaveBeenCalledTimes(1);
    expect(createLocalOnlyNote).toHaveBeenCalledWith(
      'user-1',
      WELCOME_NOTE_TITLE,
      WELCOME_NOTE_CONTENT,
    );
    expect(updateUser).toHaveBeenCalledWith({
      data: { welcome_seeded: true },
    });
  });

  it('singleflights concurrent calls for the same user', async () => {
    vi.mocked(createLocalOnlyNote).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve('welcome-note-id'), 20);
        }),
    );

    const user = makeUser({});
    const a = runWelcomeNoteSeedIfNeeded({ user, notesCount: 0 });
    const b = runWelcomeNoteSeedIfNeeded({ user, notesCount: 0 });
    await expect(Promise.all([a, b])).resolves.toEqual([
      'welcome-note-id',
      'welcome-note-id',
    ]);
    expect(createLocalOnlyNote).toHaveBeenCalledTimes(1);
    expect(updateUser).toHaveBeenCalledTimes(1);
  });

  it('reuses the settled promise on a sequential second call', async () => {
    const user = makeUser({});
    await expect(
      runWelcomeNoteSeedIfNeeded({ user, notesCount: 0 }),
    ).resolves.toBe('welcome-note-id');
    await expect(
      runWelcomeNoteSeedIfNeeded({ user, notesCount: 0 }),
    ).resolves.toBe('welcome-note-id');
    expect(createLocalOnlyNote).toHaveBeenCalledTimes(1);
    expect(updateUser).toHaveBeenCalledTimes(1);
  });
});
