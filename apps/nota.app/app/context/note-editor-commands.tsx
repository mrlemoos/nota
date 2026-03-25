import type { Editor } from '@tiptap/core';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MERMAID_CODE_BLOCK_INSERT } from '@/lib/tiptap-mermaid-insert';

type NoteEditorCommandsContextValue = {
  registerMermaidInserter: (fn: (() => void) | null) => void;
  insertMermaidAtCursor: () => void;
  canInsertMermaid: boolean;
};

const NoteEditorCommandsContext =
  createContext<NoteEditorCommandsContextValue | null>(null);

function noopRegister(_fn: (() => void) | null) {}

function noopInsert() {}

const fallbackValue: NoteEditorCommandsContextValue = {
  registerMermaidInserter: noopRegister,
  insertMermaidAtCursor: noopInsert,
  canInsertMermaid: false,
};

export function NoteEditorCommandsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const fnRef = useRef<(() => void) | null>(null);
  const [hasHandler, setHasHandler] = useState(false);

  const registerMermaidInserter = useCallback((fn: (() => void) | null) => {
    fnRef.current = fn;
    setHasHandler(fn != null);
  }, []);

  const insertMermaidAtCursor = useCallback(() => {
    fnRef.current?.();
  }, []);

  const value = useMemo(
    () =>
      ({
        registerMermaidInserter,
        insertMermaidAtCursor,
        canInsertMermaid: hasHandler,
      }) satisfies NoteEditorCommandsContextValue,
    [registerMermaidInserter, insertMermaidAtCursor, hasHandler],
  );

  return (
    <NoteEditorCommandsContext.Provider value={value}>
      {children}
    </NoteEditorCommandsContext.Provider>
  );
}

export function useNoteEditorCommands(): NoteEditorCommandsContextValue {
  const ctx = useContext(NoteEditorCommandsContext);
  return ctx ?? fallbackValue;
}

/** Registers TipTap `insertContent` for Mermaid; clears on unmount or when `editor` is null. */
export function useRegisterNoteEditorMermaidInserter(
  editor: Editor | null,
): void {
  const ctx = useContext(NoteEditorCommandsContext);

  useEffect(() => {
    if (!ctx) return;
    if (!editor) {
      ctx.registerMermaidInserter(null);
      return;
    }
    const run = () => {
      editor.chain().focus().insertContent(MERMAID_CODE_BLOCK_INSERT).run();
    };
    ctx.registerMermaidInserter(run);
    return () => {
      ctx.registerMermaidInserter(null);
    };
  }, [editor, ctx]);
}
