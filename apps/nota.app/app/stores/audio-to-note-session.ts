import { create } from 'zustand';

export type AudioToNotePhase = 'idle' | 'recording' | 'processing' | 'error';

type State = {
  recordingSessionId: number;
  phase: AudioToNotePhase;
  noteId: string | null;
  streamPreview: string;
  error: string | null;
  statusLine: string;
  reset: () => void;
  beginSession: (noteId: string) => void;
  setProcessing: (line: string) => void;
  appendPreview: (chunk: string) => void;
  setError: (message: string) => void;
};

export const useAudioToNoteSession = create<State>((set) => ({
  recordingSessionId: 0,
  phase: 'idle',
  noteId: null,
  streamPreview: '',
  error: null,
  statusLine: '',
  reset: () =>
    set({
      phase: 'idle',
      noteId: null,
      streamPreview: '',
      error: null,
      statusLine: '',
    }),
  beginSession: (noteId) =>
    set((s) => ({
      phase: 'recording',
      noteId,
      recordingSessionId: s.recordingSessionId + 1,
      streamPreview: '',
      error: null,
      statusLine: 'Requesting microphone…',
    })),
  setProcessing: (line) =>
    set({ phase: 'processing', statusLine: line, streamPreview: '' }),
  appendPreview: (chunk) =>
    set((s) => ({
      streamPreview: s.streamPreview + chunk,
    })),
  setError: (message) =>
    set({ phase: 'error', error: message, statusLine: '' }),
}));
