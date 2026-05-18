import { useMemo, useState, type JSX } from 'react';
import { cn } from '@/lib/utils';
import {
  buildJournalEntriesFromNotes,
  filterJournalEntriesByDateKey,
  journalDateKeysFromEntries,
} from '@/lib/journal-notes';
import { navigateFromLegacyPath } from '@/lib/app-navigation';
import { useNotesDataVault } from '@/context/notes-data-context';
import { useNotaTranslator } from '@/lib/use-nota-translator';
import { parseDateKey } from '@/lib/journal-calendar';
import { JournalCalendar } from './journal-calendar';
import { JournalNotesList } from './journal-notes-list';

function initialVisibleMonth(
  entries: ReturnType<typeof buildJournalEntriesFromNotes>,
): { year: number; month: number } {
  const anchor = entries[0]?.date ?? new Date();
  return { year: anchor.getFullYear(), month: anchor.getMonth() };
}

export function JournalScreen(): JSX.Element {
  const { notes } = useNotesDataVault();
  const { t } = useNotaTranslator();
  const entries = useMemo(() => buildJournalEntriesFromNotes(notes), [notes]);
  const dateKeysWithNotes = useMemo(
    () => journalDateKeysFromEntries(entries),
    [entries],
  );

  const [visibleMonth, setVisibleMonth] = useState(() =>
    initialVisibleMonth(entries),
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const filteredEntries = useMemo(
    () => filterJournalEntriesByDateKey(entries, selectedDateKey),
    [entries, selectedDateKey],
  );

  const listHeading = selectedDateKey
    ? (() => {
        const { year, month, day } = parseDateKey(selectedDateKey);
        return new Date(year, month - 1, day);
      })().toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : t('All entries');

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8">
        <header>
          <h1 className="font-serif text-2xl font-semibold tracking-normal text-foreground">
            {t('Journal')}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-pretty text-muted-foreground">
            {t(
              'Notes titled with a date — browse by calendar or scroll the timeline.',
            )}
          </p>
        </header>

        <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-8">
          <section
            className={cn(
              'rounded-xl border border-border/60 bg-muted/15 p-4',
              'backdrop-blur-md dark:bg-black/20',
            )}
            aria-label={t('Journal calendar')}
          >
            <JournalCalendar
              year={visibleMonth.year}
              month={visibleMonth.month}
              dateKeysWithNotes={dateKeysWithNotes}
              selectedDateKey={selectedDateKey}
              onSelectDateKey={setSelectedDateKey}
              onMonthChange={(year, month) => {
                setVisibleMonth({ year, month });
              }}
            />
          </section>

          <section
            className={cn(
              'flex min-h-[min(24rem,50vh)] flex-col rounded-xl border border-border/60',
              'bg-background/40 p-4 backdrop-blur-md dark:bg-background/25',
            )}
            aria-label={t('Journal entries')}
          >
            <div className="mb-3 flex shrink-0 items-baseline justify-between gap-2 border-b border-border/40 pb-3">
              <h2 className="font-serif text-lg font-semibold tracking-normal text-foreground">
                {listHeading}
              </h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {t('{count} notes', { count: filteredEntries.length })}
              </span>
            </div>
            <JournalNotesList
              entries={filteredEntries}
              onOpenNote={(id) => {
                navigateFromLegacyPath(`/notes/${id}`);
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
