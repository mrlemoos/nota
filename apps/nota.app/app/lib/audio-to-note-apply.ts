import type { Note } from '~/types/database.types';
import { getBrowserClient } from './supabase/browser';
import { getStoredNote, saveLocalNoteDraft } from './notes-offline';
import { getNote, updateNote } from '../models/notes';
import {
  studyNotesResultToTiptapDoc,
  type AudioNoteStudyResult,
} from './audio-note-blocks-to-doc';
import { formatStudyNoteTitle } from './study-note-title';

async function resolveNoteCreatedAtIso(
  noteId: string,
  userId: string,
): Promise<string> {
  const client = getBrowserClient();
  const row = await getNote(client, noteId);
  if (row?.created_at) {
    return row.created_at;
  }
  const local = await getStoredNote(userId, noteId);
  if (local?.created_at) {
    return local.created_at;
  }
  return new Date().toISOString();
}

export async function applyAudioNoteStudyResult(options: {
  noteId: string;
  userId: string;
  result: AudioNoteStudyResult;
  /** When upload succeeded; omitted if upload failed or skipped. */
  recording?: { attachmentId: string; filename: string };
  patchNoteInList: (id: string, patch: Partial<Note>) => void;
  refreshNotesList: (o?: { silent?: boolean }) => Promise<void>;
}): Promise<void> {
  const createdAtIso = await resolveNoteCreatedAtIso(
    options.noteId,
    options.userId,
  );
  const title = formatStudyNoteTitle(createdAtIso, options.result.title);
  const content = studyNotesResultToTiptapDoc(options.result, {
    recording: options.recording,
  });
  const client = getBrowserClient();
  const row = await updateNote(client, options.noteId, {
    title,
    content,
  });
  options.patchNoteInList(options.noteId, row);
  await saveLocalNoteDraft(options.userId, {
    id: options.noteId,
    title,
    content,
  });
  await options.refreshNotesList({ silent: true });
}
