import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotesSidebarList } from './notes-sidebar-list';
import { useNotesSidebarStore } from '../stores/notes-sidebar';
import { clientRenameFolder } from '../lib/rename-folder-client';

vi.mock('../lib/rename-folder-client', () => ({
  clientRenameFolder: vi.fn(() => Promise.resolve()),
}));

describe('NotesSidebarList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotesSidebarStore.setState({ open: true, collapsedFolderIds: [] });
  });

  it('allows inline folder rename on double click and commits on blur', () => {
    // Arrange
    const patchFolderInList = vi.fn();

    render(
      <NotesSidebarList
        notes={[]}
        folders={[
          {
            id: 'folder-1',
            user_id: 'user-1',
            name: 'Computer Science Study',
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        patchFolderInList={patchFolderInList}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );

    // Act
    fireEvent.doubleClick(screen.getByText('Computer Science Study'));
    const renameInput = screen.getByLabelText(
      'Rename folder Computer Science Study',
    ) as HTMLInputElement;
    const hasFocusAfterRename = document.activeElement === renameInput;
    const caretStartAfterRename = renameInput.selectionStart;
    const caretEndAfterRename = renameInput.selectionEnd;
    const valueLengthAfterRename = renameInput.value.length;

    fireEvent.change(renameInput, { target: { value: 'Computer Science I' } });
    fireEvent.blur(renameInput);

    // Assert
    expect(hasFocusAfterRename).toBe(true);
    expect(caretStartAfterRename).toBe(valueLengthAfterRename);
    expect(caretEndAfterRename).toBe(valueLengthAfterRename);
    expect(clientRenameFolder).toHaveBeenCalledWith(
      expect.objectContaining({
        folderId: 'folder-1',
        previousName: 'Computer Science Study',
        nextName: 'Computer Science I',
        userId: 'user-1',
        notaProEntitled: true,
        patchFolderInList,
      }),
    );
  });

  it('starts inline rename when F2 is pressed on a folder row', () => {
    // Arrange
    render(
      <NotesSidebarList
        notes={[]}
        folders={[
          {
            id: 'folder-1',
            user_id: 'user-1',
            name: 'Computer Science Study',
            created_at: '2026-04-25T00:00:00.000Z',
            updated_at: '2026-04-25T00:00:00.000Z',
          },
        ]}
        panel="list"
        routeNoteId={null}
        userId="user-1"
        notaProEntitled
        userPreferences={null}
        insertNoteAtFront={vi.fn()}
        patchFolderInList={vi.fn()}
        removeNoteFromList={vi.fn()}
        removeFolderFromList={vi.fn()}
        refreshNotesList={vi.fn(() => Promise.resolve())}
      />,
    );
    const folderLabel = screen.getByText('Computer Science Study');
    const folderRowButton = folderLabel.closest('button') as HTMLButtonElement;

    // Act
    folderRowButton.focus();
    fireEvent.keyDown(folderRowButton, { key: 'F2' });

    // Assert
    expect(
      screen.getByLabelText('Rename folder Computer Science Study'),
    ).toBeTruthy();
  });
});
