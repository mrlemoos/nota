export type {
  LocalNoteMeta,
  OutboxEntry,
  OutboxKind,
  StoredNote,
} from './lib/types.js';
export { DEFAULT_NOTE_CONTENT } from './lib/types.js';
export {
  closeNotaNotesDb,
  deleteNotaNotesDb,
  getNotaNotesDb,
  idbRequest,
  NOTES_OBJECT_STORE,
  OUTBOX_OBJECT_STORE,
  transactionComplete,
} from './lib/db.js';
export {
  createLocalOnlyNote,
  getStoredNote,
  listStoredNotes,
  markNoteSyncedFromServer,
  markPendingDelete,
  putServerNoteIfNotDirty,
  removeStoredNote,
  saveLocalNoteDraft,
} from './lib/local-note-store.js';
export {
  listOutbox,
  removeOutboxEntry,
  sortOutboxForProcessing,
} from './lib/outbox.js';
export {
  mergeNoteLists,
  mergeNoteWithLocal,
  storedNoteToListRow,
} from './lib/merge-note-with-local.js';
