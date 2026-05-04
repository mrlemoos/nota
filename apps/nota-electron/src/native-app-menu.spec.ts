import { describe, expect, it, vi } from 'vitest';
import type { MenuItemConstructorOptions } from 'electron';
import { buildNotaAppMenuTemplate } from './native-app-menu.js';

function submenuOf(
  template: MenuItemConstructorOptions[],
  label: string,
): MenuItemConstructorOptions[] {
  const top = template.find((m) => m.label === label);
  const sub = top?.submenu;
  return Array.isArray(sub) ? sub : [];
}

describe('buildNotaAppMenuTemplate', () => {
  it('includes note actions with accelerators', () => {
    // Arrange
    const onNewNote = vi.fn();
    const onMoveToFolder = vi.fn();
    const onNewFolder = vi.fn();
    const onQuit = vi.fn();
    const onNewNoteFromClipboard = vi.fn();
    const onStudyNotesFromRecording = vi.fn();

    // Act
    const template = buildNotaAppMenuTemplate({
      onNewNote,
      onMoveToFolder,
      onNewFolder,
      onQuit,
      onNewNoteFromClipboard,
      onStudyNotesFromRecording,
    });

    // Assert
    const notesItems = submenuOf(template, 'Notes');
    const foldersItems = submenuOf(template, 'Folders');
    expect(notesItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'New note',
          accelerator: 'CmdOrCtrl+N',
        }),
        expect.objectContaining({
          label: 'New note from clipboard',
          accelerator: 'CmdOrCtrl+Shift+N',
        }),
        expect.objectContaining({
          label: 'Study notes from recording…',
          accelerator: 'CmdOrCtrl+Shift+R',
        }),
      ]),
    );
    expect(foldersItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Move to folder',
          accelerator: 'CmdOrCtrl+M',
        }),
        expect.objectContaining({
          label: 'New folder',
          accelerator: 'CmdOrCtrl+Shift+N',
        }),
      ]),
    );
  });

  it('includes View refresh and developer tools with roles', () => {
    // Arrange
    const noop = vi.fn();

    // Act
    const template = buildNotaAppMenuTemplate({
      onNewNote: noop,
      onMoveToFolder: noop,
      onNewFolder: noop,
      onQuit: noop,
      onNewNoteFromClipboard: noop,
      onStudyNotesFromRecording: noop,
    });

    // Assert
    const viewItems = submenuOf(template, 'View');
    expect(viewItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Refresh',
          role: 'reload',
          accelerator: 'CmdOrCtrl+R',
        }),
        expect.objectContaining({
          label: 'Open Developer Tools',
          role: 'toggleDevTools',
          accelerator: 'Alt+CmdOrCtrl+I',
        }),
      ]),
    );
  });

  it('wires click handlers to the provided callbacks', () => {
    // Arrange
    const onNewNote = vi.fn();
    const onMoveToFolder = vi.fn();
    const onNewFolder = vi.fn();
    const onQuit = vi.fn();
    const onNewNoteFromClipboard = vi.fn();
    const onStudyNotesFromRecording = vi.fn();

    // Act
    const template = buildNotaAppMenuTemplate({
      onNewNote,
      onMoveToFolder,
      onNewFolder,
      onQuit,
      onNewNoteFromClipboard,
      onStudyNotesFromRecording,
    });
    const notesItems = submenuOf(template, 'Notes') as Array<{
      label?: string;
      click?: () => void;
    }>;
    const foldersItems = submenuOf(template, 'Folders') as Array<{
      label?: string;
      click?: () => void;
    }>;
    notesItems.find((item) => item.label === 'New note')?.click?.();
    notesItems
      .find((item) => item.label === 'New note from clipboard')
      ?.click?.();
    notesItems
      .find((item) => item.label === 'Study notes from recording…')
      ?.click?.();
    foldersItems.find((item) => item.label === 'Move to folder')?.click?.();
    foldersItems.find((item) => item.label === 'New folder')?.click?.();

    // Assert
    expect(onNewNote).toHaveBeenCalledTimes(1);
    expect(onMoveToFolder).toHaveBeenCalledTimes(1);
    expect(onNewFolder).toHaveBeenCalledTimes(1);
    expect(onNewNoteFromClipboard).toHaveBeenCalledTimes(1);
    expect(onStudyNotesFromRecording).toHaveBeenCalledTimes(1);
    expect(onQuit).not.toHaveBeenCalled();
  });
});
