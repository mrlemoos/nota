import type { UIMatch } from 'react-router';
import type { Note } from '~/types/database.types';

export function notesFromMatches(matches: UIMatch[]): Note[] {
  for (const m of matches) {
    const d = m.data;
    if (
      d &&
      typeof d === 'object' &&
      'notes' in d &&
      Array.isArray((d as { notes: unknown }).notes)
    ) {
      return (d as { notes: Note[] }).notes;
    }
  }
  return [];
}
