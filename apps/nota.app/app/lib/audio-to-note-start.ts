import type { Note } from '~/types/database.types';
import { setAppHash } from './app-navigation';
import { getBrowserClient } from './supabase/browser';
import { createLocalOnlyNote, isLikelyOnline } from './notes-offline';
import { createNote } from '../models/notes';
import { useAudioToNoteSession } from '../stores/audio-to-note-session';

const PLACEHOLDER_TITLE = 'Study notes — recording';

/**
 * Creates a note and opens the assistive audio-to-note capture session (microphone + upload).
 */
export async function startStudyNotesFromRecording(options: {
  userId: string;
  notaProEntitled: boolean;
  insertNoteAtFront: (n: Note) => void;
  refreshNotesList: (o?: { silent?: boolean }) => Promise<void>;
}): Promise<void> {
  if (!options.notaProEntitled || !options.userId) {
    return;
  }

  const goToNote = (id: string): void => {
    setAppHash({ kind: 'notes', panel: 'note', noteId: id });
  };

  if (!isLikelyOnline()) {
    const id = await createLocalOnlyNote(options.userId, PLACEHOLDER_TITLE);
    goToNote(id);
    await options.refreshNotesList({ silent: true });
    useAudioToNoteSession.getState().beginSession(id);
    return;
  }

  const c = getBrowserClient();
  try {
    const row = await createNote(c, options.userId, PLACEHOLDER_TITLE);
    options.insertNoteAtFront(row);
    goToNote(row.id);
    await options.refreshNotesList({ silent: true });
    useAudioToNoteSession.getState().beginSession(row.id);
  } catch {
    const id = await createLocalOnlyNote(options.userId, PLACEHOLDER_TITLE);
    goToNote(id);
    await options.refreshNotesList({ silent: true });
    useAudioToNoteSession.getState().beginSession(id);
  }
}
