'use client';

import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { TipTapEditor } from '@getmadrid/editor';
import { NotesGraphScreen } from '@getmadrid/note-graph';
import { NotesSidebarList } from '@getmadrid/notes-chrome-ui/notes-sidebar-list';
import {
  notesMainChrome,
  notesSidebarChrome,
} from '@getmadrid/notes-chrome-core/notes-chrome';
import { cn } from '@getmadrid/design/utils';
import { useNotaTranslator } from '@/lib/use-nota-translator';
import {
  DEMO_FOLDERS,
  DEMO_NOTES,
  DEMO_PREFERENCES,
  MENTION_CANDIDATES,
  NOTE_IDS,
  OPEN_NOTE_TITLE,
} from './demo-vault';

export type HeroScene = 'write' | 'graph';

/** Handle the recorder drives from Playwright. */
export interface HeroStageHandle {
  setScene: (scene: HeroScene) => void;
  /** Fades the window against the fixed backdrop so the film loops without a cut. */
  setDim: (dim: boolean) => void;
  ready: boolean;
}

declare global {
  interface Window {
    __heroStage?: HeroStageHandle;
  }
}

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

function TrafficLights(): JSX.Element {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      {['#ff5f57', '#febc2e', '#28c840'].map((colour) => (
        <span
          key={colour}
          className="size-3 rounded-full"
          style={{ backgroundColor: colour }}
        />
      ))}
    </div>
  );
}

/**
 * Filmable recreation of the notes workspace, mounted from the real product
 * components (`NotesSidebarList`, `TipTapEditor`, `NotesGraphView`) over the
 * invented vault in `demo-vault.ts`.
 *
 * ponytail: no data providers here on purpose. Those three components already
 * take their data as props, so the stage needs neither Clerk nor Supabase, and
 * the recording can never pick up a real note.
 */
export function HeroStage(): JSX.Element {
  const { t } = useNotaTranslator();
  const [scene, setScene] = useState<HeroScene>('write');
  const [dim, setDim] = useState(true);

  const noop = useCallback(() => undefined, []);
  const noopAsync = useCallback(() => Promise.resolve(), []);
  const rejectUpload = useCallback(
    (): Promise<never> =>
      Promise.reject(new Error('The hero stage does not accept attachments')),
    [],
  );

  useEffect(() => {
    // The hero is filmed light, matching the product shots further down the page.
    const root = document.documentElement;
    root.classList.add('light');
    root.classList.remove('dark');
  }, []);

  useEffect(() => {
    window.__heroStage = { setScene, setDim, ready: true };
    return () => {
      delete window.__heroStage;
    };
  }, []);

  const graphNotes = useMemo(() => DEMO_NOTES, []);

  return (
    <div className="hero-stage-backdrop flex h-dvh w-full items-center justify-center">
      <div
        className={cn(
          'hero-stage-window flex h-[760px] w-[1200px] overflow-hidden rounded-[14px] bg-background',
          'transition-opacity duration-500 ease-out',
          dim ? 'opacity-0' : 'opacity-100',
        )}
      >
        <aside
          className={cn(
            notesSidebarChrome,
            'flex w-[268px] shrink-0 flex-col gap-3 px-3 pt-3.5 pb-3',
          )}
        >
          <TrafficLights />
          <div className="flex-1 min-h-0 overflow-y-auto">
            <NotesSidebarList
              notes={DEMO_NOTES}
              folders={DEMO_FOLDERS}
              panel="note"
              routeNoteId={NOTE_IDS.commonplace}
              userId={DEMO_PREFERENCES.user_id}
              notaProEntitled
              userPreferences={DEMO_PREFERENCES}
              insertNoteAtFront={noop}
              insertFolderSorted={noop}
              patchNoteInList={noop}
              patchFolderInList={noop}
              removeNoteFromList={noop}
              removeFolderFromList={noop}
              refreshNotesList={noopAsync}
            />
          </div>
        </aside>

        <main className={cn(notesMainChrome, 'relative flex-1 min-w-0')}>
          <div
            data-scene="write"
            inert={scene !== 'write'}
            className={cn(
              'absolute inset-0 overflow-y-auto transition-opacity duration-500 ease-out',
              scene === 'write'
                ? 'opacity-100'
                : 'pointer-events-none opacity-0',
            )}
          >
            <article className="mx-auto w-full max-w-2xl px-10 pt-16 pb-24">
              <h1 className="font-serif text-4xl font-extrabold leading-tight text-pretty text-foreground md:text-5xl">
                {OPEN_NOTE_TITLE}
              </h1>
              <div className="mt-6">
                <TipTapEditor
                  content={EMPTY_DOC}
                  noteId={NOTE_IDS.commonplace}
                  placeholder="Start writing..."
                  noteMentionCandidates={MENTION_CANDIDATES}
                  onUpdate={noop}
                  // The `@` menu is gated behind the attachment capability
                  // (`userId && noteId && onUploadFile`), so the stage has to
                  // look uploadable even though nothing is ever dropped on it.
                  userId={DEMO_PREFERENCES.user_id}
                  proEntitled
                  onUploadFile={rejectUpload}
                />
              </div>
            </article>
          </div>

          <div
            data-scene="graph"
            inert={scene !== 'graph'}
            className={cn(
              'absolute inset-0 flex flex-col transition-opacity duration-500 ease-out',
              scene === 'graph'
                ? 'opacity-100'
                : 'pointer-events-none opacity-0',
            )}
          >
            <NotesGraphScreen notes={graphNotes} onOpenNote={noop} t={t} />
          </div>
        </main>
      </div>
    </div>
  );
}
