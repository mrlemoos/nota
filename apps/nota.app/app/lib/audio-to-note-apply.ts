import type { Note } from '~/types/database.types';
import { getBrowserClient } from './supabase/browser';
import { saveLocalNoteDraft } from './notes-offline';
import { updateNote } from '../models/notes';
import {
  studyNotesResultToTiptapDoc,
  type AudioNoteStudyResult,
} from './audio-note-blocks-to-doc';

export async function applyAudioNoteStudyResult(options: {
  noteId: string;
  userId: string;
  result: AudioNoteStudyResult;
  patchNoteInList: (id: string, patch: Partial<Note>) => void;
  refreshNotesList: (o?: { silent?: boolean }) => Promise<void>;
}): Promise<void> {
  const content = studyNotesResultToTiptapDoc(options.result);
  const client = getBrowserClient();
  const row = await updateNote(client, options.noteId, {
    title: options.result.title,
    content,
  });
  options.patchNoteInList(options.noteId, row);
  await saveLocalNoteDraft(options.userId, {
    id: options.noteId,
    title: options.result.title,
    content,
  });
  await options.refreshNotesList({ silent: true });
}
