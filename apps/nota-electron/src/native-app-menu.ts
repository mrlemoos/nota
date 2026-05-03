import type { MenuItemConstructorOptions } from 'electron';

export type NotaAppMenuActions = {
  onNewNote: () => void;
  onMoveToFolder: () => void;
  onNewFolder: () => void;
  onQuit: () => void;
  onNewNoteFromClipboard: () => void;
  onStudyNotesFromRecording: () => void;
};

export function buildNotaAppMenuTemplate(
  actions: NotaAppMenuActions,
): MenuItemConstructorOptions[] {
  return [
    {
      label: 'Nota',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide', label: 'Hide Nota' },
        { role: 'hideOthers', label: 'Hide Others' },
        { role: 'unhide', label: 'Show All' },
        { type: 'separator' },
        {
          label: 'Quit Nota',
          role: 'quit',
          click: actions.onQuit,
        },
      ],
    },
    {
      label: 'Notes',
      submenu: [
        {
          label: 'New note',
          accelerator: 'CmdOrCtrl+N',
          click: actions.onNewNote,
        },
        {
          label: 'New note from clipboard',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: actions.onNewNoteFromClipboard,
        },
        {
          label: 'Study notes from recording…',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: actions.onStudyNotesFromRecording,
        },
      ],
    },
    {
      label: 'Folders',
      submenu: [
        {
          label: 'Move to folder',
          accelerator: 'CmdOrCtrl+M',
          click: actions.onMoveToFolder,
        },
        {
          label: 'New folder',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: actions.onNewFolder,
        },
      ],
    },
  ];
}
