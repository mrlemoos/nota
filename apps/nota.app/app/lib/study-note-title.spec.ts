import { describe, expect, it } from 'vitest';
import { dailyNoteDisplayTitle } from './todays-note';
import {
  formatStudyNoteTitle,
  studyNotePlaceholderQueuedTitle,
  studyNotePlaceholderRecordingTitle,
} from './study-note-title';

describe('formatStudyNoteTitle', () => {
  it('formats base title from note created_at', () => {
    const created = '2026-04-15T10:00:00.000Z';
    const day = dailyNoteDisplayTitle(new Date(created));
    expect(formatStudyNoteTitle(created, '  ')).toBe(`Study note: ${day}`);
  });

  it('appends non-generic model title', () => {
    const created = '2026-03-04T12:00:00.000Z';
    const day = dailyNoteDisplayTitle(new Date(created));
    expect(formatStudyNoteTitle(created, 'Thermodynamics')).toBe(
      `Study note: ${day} — Thermodynamics`,
    );
  });

  it('omits generic fallback title', () => {
    const created = '2026-01-01T00:00:00.000Z';
    const day = dailyNoteDisplayTitle(new Date(created));
    expect(formatStudyNoteTitle(created, 'Study notes')).toBe(
      `Study note: ${day}`,
    );
  });
});

describe('placeholders', () => {
  it('recording and queued titles share Study note prefix', () => {
    expect(studyNotePlaceholderRecordingTitle()).toMatch(/^Study note: /);
    expect(studyNotePlaceholderRecordingTitle()).toContain('recording');
    expect(studyNotePlaceholderQueuedTitle()).toMatch(/^Study note: /);
    expect(studyNotePlaceholderQueuedTitle()).toContain('queued for sync');
  });
});
