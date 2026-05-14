import { describe, expect, it } from 'vitest';
import type { Note } from '@nota/database-types';
import { mergeNoteLists } from './merge-note-with-local.js';
import type { StoredNote } from './types.js';
import golden from './fixtures/merge-note-lists-golden.json' with { type: 'json' };

describe('mergeNoteLists golden fixture', () => {
  it('matches stable cross-platform expectations for server + dirty local merge', () => {
    // Arrange
    const serverNotes = golden.serverNotes as Note[];
    const stored = golden.storedNotes as StoredNote[];

    // Act
    const merged = mergeNoteLists(serverNotes, stored);

    // Assert
    const byId = new Map(merged.map((n) => [n.id, n]));
    for (const [id, title] of Object.entries(golden.expectedTitlesById)) {
      expect(byId.get(id)?.title).toBe(title);
    }
    expect(merged).toHaveLength(2);
    const newestFirst = [...merged].sort((a, b) =>
      b.updated_at.localeCompare(a.updated_at),
    );
    expect(merged).toEqual(newestFirst);
  });
});
