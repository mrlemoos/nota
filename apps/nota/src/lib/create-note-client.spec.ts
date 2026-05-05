import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientCreateNote } from './create-note-client';

import { createLocalOnlyNote, isLikelyOnline } from './notes-offline';
import { createNote } from '../models/notes';

const insertNoteAtFront = vi.fn();
const refreshNotesList = vi.fn();

vi.mock('./supabase/browser', () => ({
  getBrowserClient: () => ({}),
}));

vi.mock('./notes-offline', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./notes-offline')>();
  return {
    ...actual,
    createLocalOnlyNote: vi.fn(() => Promise.resolve('local-note-id')),
    isLikelyOnline: vi.fn(),
  };
});

vi.mock('../models/notes', () => ({
  createNote: vi.fn(() =>
    Promise.resolve({
      id: 'server-note-id',
      user_id: 'u1',
      title: 'Untitled Note',
      content: { type: 'doc', content: [] },
      created_at: '',
      updated_at: '',
      due_at: null,
      is_deadline: false,
      editor_settings: {},
      banner_attachment_id: null,
      folder_id: 'folder-1',
    }),
  ),
}));

vi.mock('./app-navigation', () => ({
  setAppHash: vi.fn(),
}));

describe('clientCreateNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when not entitled', async () => {
    // Arrange
    vi.mocked(isLikelyOnline).mockReturnValue(true);
    const args = {
      userId: 'u1',
      insertNoteAtFront,
      refreshNotesList,
      notaProEntitled: false,
    };

    // Act
    await clientCreateNote(args);

    // Assert
    expect(createNote).not.toHaveBeenCalled();
    expect(createLocalOnlyNote).not.toHaveBeenCalled();
    expect(refreshNotesList).not.toHaveBeenCalled();
  });

  it('creates in a folder on the server when online and Nota Pro', async () => {
    // Arrange
    vi.mocked(isLikelyOnline).mockReturnValue(true);
    const args = {
      userId: 'u1',
      insertNoteAtFront,
      refreshNotesList,
      notaProEntitled: true,
      folderId: 'folder-1' as const,
    };

    // Act
    await clientCreateNote(args);

    // Assert
    expect(createNote).toHaveBeenCalled();
    expect(insertNoteAtFront).toHaveBeenCalled();
  });

  it('creates untitled note at root on server when online', async () => {
    // Arrange
    vi.mocked(isLikelyOnline).mockReturnValue(true);
    const args = {
      userId: 'u1',
      insertNoteAtFront,
      refreshNotesList,
      notaProEntitled: true,
    };

    // Act
    await clientCreateNote(args);

    // Assert
    expect(createNote).toHaveBeenCalledWith(
      expect.anything(),
      'u1',
      'Untitled Note',
      undefined,
      { folder_id: null },
    );
    expect(insertNoteAtFront).toHaveBeenCalled();
    expect(refreshNotesList).toHaveBeenCalled();
  });

  it('creates untitled note at root locally when offline', async () => {
    // Arrange
    vi.mocked(isLikelyOnline).mockReturnValue(false);
    const args = {
      userId: 'u1',
      insertNoteAtFront,
      refreshNotesList,
      notaProEntitled: true,
    };

    // Act
    await clientCreateNote(args);

    // Assert
    expect(createLocalOnlyNote).toHaveBeenCalledWith(
      'u1',
      undefined,
      undefined,
      null,
    );
    expect(createNote).not.toHaveBeenCalled();
    expect(refreshNotesList).toHaveBeenCalled();
  });

  it('does nothing when offline and not entitled', async () => {
    // Arrange
    vi.mocked(isLikelyOnline).mockReturnValue(false);
    const args = {
      userId: 'u1',
      insertNoteAtFront,
      refreshNotesList,
      notaProEntitled: false,
    };

    // Act
    await clientCreateNote(args);

    // Assert
    expect(createNote).not.toHaveBeenCalled();
    expect(createLocalOnlyNote).not.toHaveBeenCalled();
  });
});
