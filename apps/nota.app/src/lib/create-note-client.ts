import { getBrowserClient } from './supabase/browser';
import { createLocalOnlyNote, isLikelyOnline } from './notes-offline';
import { createNote } from '../models/notes';
import { setAppHash } from './app-navigation';
import type { Note } from '~/types/database.types';

export async function clientCreateNote(options: {
  userId: string;
  insertNoteAtFront: (n: Note) => void;
  refreshNotesList: (options?: { silent?: boolean }) => Promise<void>;
  notaProEntitled: boolean;
  /** Omit or `null` = new untitled note at root. UUID string = new note in that folder. */
  folderId?: string | null;
  notes?: Pick<Note, 'id' | 'folder_id'>[];
}): Promise<void> {
  const { userId, folderId } = options;
  if (!userId) {
    return;
  }

  if (!options.notaProEntitled) {
    return;
  }

  const c = getBrowserClient();

  function goToNote(id: string): void {
    setAppHash({ kind: 'notes', panel: 'note', noteId: id });
  }

  const targetFolderId = folderId === undefined ? null : folderId;

  if (targetFolderId !== null) {
    if (!isLikelyOnline()) {
      const id = await createLocalOnlyNote(
        userId,
        undefined,
        undefined,
        targetFolderId,
      );
      goToNote(id);
      await options.refreshNotesList({ silent: true });
      return;
    }

    try {
      const row = await createNote(c, userId, 'Untitled Note', undefined, {
        folder_id: targetFolderId,
      });
      options.insertNoteAtFront(row);
      goToNote(row.id);
      await options.refreshNotesList({ silent: true });
    } catch {
      const id = await createLocalOnlyNote(
        userId,
        undefined,
        undefined,
        targetFolderId,
      );
      goToNote(id);
      await options.refreshNotesList({ silent: true });
    }
    return;
  }

  if (!isLikelyOnline()) {
    const id = await createLocalOnlyNote(userId, undefined, undefined, null);
    goToNote(id);
    await options.refreshNotesList({ silent: true });
    return;
  }

  try {
    const row = await createNote(c, userId, 'Untitled Note', undefined, {
      folder_id: null,
    });
    options.insertNoteAtFront(row);
    goToNote(row.id);
    await options.refreshNotesList({ silent: true });
  } catch {
    const id = await createLocalOnlyNote(userId, undefined, undefined, null);
    goToNote(id);
    await options.refreshNotesList({ silent: true });
  }
}
