import { describe, expect, test } from 'bun:test';
import {
  fallbackStudyNotesFromTranscript,
  parseStudyNotesJson,
  studyNotesResultSchema,
} from './xai-audio-note.server.ts';

describe('parseStudyNotesJson', () => {
  test('parses strict JSON', () => {
    const raw = `{"title":"Thermodynamics","blocks":[{"type":"heading","level":2,"text":"Overview"},{"type":"paragraph","text":"Heat is energy."}]}`;
    const r = parseStudyNotesJson(raw);
    expect(r.title).toBe('Thermodynamics');
    expect(r.blocks).toHaveLength(2);
  });

  test('extracts JSON from surrounding noise', () => {
    const raw = `Here is the JSON:\n{"title":"A","blocks":[{"type":"paragraph","text":"B"}]}\nThanks`;
    const r = parseStudyNotesJson(raw);
    expect(studyNotesResultSchema.safeParse(r).success).toBe(true);
    expect(r.title).toBe('A');
  });
});

describe('fallbackStudyNotesFromTranscript', () => {
  test('wraps empty transcript', () => {
    const r = fallbackStudyNotesFromTranscript('   ');
    expect(r.title).toBe('Study notes');
    expect(r.blocks[0]).toEqual({
      type: 'paragraph',
      text: '(Empty transcript)',
    });
  });
});
