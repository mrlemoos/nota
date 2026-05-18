import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, type JSX } from 'react';
import { cn } from '@/lib/utils';
import type { JournalEntry } from '@/lib/journal-notes';
import { useNotaTranslator } from '@/lib/use-nota-translator';

const ROW_HEIGHT_PX = 56;

export function JournalNotesList({
  entries,
  onOpenNote,
}: {
  entries: readonly JournalEntry[];
  onOpenNote: (noteId: string) => void;
}): JSX.Element {
  const { t } = useNotaTranslator();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 8,
  });

  if (entries.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-muted-foreground">
        {t('No journal entries for this day.')}
      </p>
    );
  }

  return (
    <div
      ref={parentRef}
      className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]"
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const entry = entries[virtualRow.index]!;
          const label = entry.date.toLocaleDateString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <button
              key={entry.noteId}
              type="button"
              onClick={() => {
                onOpenNote(entry.noteId);
              }}
              className={cn(
                'absolute inset-x-0 flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left',
                'transition-colors hover:bg-muted/50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="line-clamp-1 text-sm font-medium text-foreground">
                {entry.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
