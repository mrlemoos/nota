import { useMemo, type JSX } from 'react';
import { NavLink, useMatches } from 'react-router';
import { notesFromMatches } from '../lib/notes-from-matches';
import { buildNoteLinkGraph } from '../lib/note-link-graph';
import { cn } from '@/lib/utils';

export function NoteBacklinksPanel({ noteId }: { noteId: string }): JSX.Element {
  const matches = useMatches();
  const notes = notesFromMatches(matches);

  const { backlinkIds, byId } = useMemo(() => {
    const { backlinks } = buildNoteLinkGraph(notes);
    const ids = [...(backlinks.get(noteId) ?? [])].sort();
    const map = new Map(notes.map((n) => [n.id, n]));
    return { backlinkIds: ids, byId: map };
  }, [notes, noteId]);

  return (
    <section
      className="border-t border-border/40 pt-6"
      aria-labelledby="note-backlinks-heading"
    >
      <h2
        id="note-backlinks-heading"
        className="mb-3 text-sm font-medium text-foreground"
      >
        Backlinks
      </h2>
      {backlinkIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No other notes link here yet.
        </p>
      ) : (
        <ul className="space-y-1">
          {backlinkIds.map((id) => {
            const note = byId.get(id);
            if (!note) return null;
            const label = note.title?.trim() ? note.title : 'Untitled Note';
            return (
              <li key={id}>
                <NavLink
                  to={`/notes/${id}`}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-md px-2 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )
                  }
                >
                  {label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
