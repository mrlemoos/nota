import { describe, expect, it } from 'vitest';
import {
  studyNotesResultToTiptapDoc,
  type AudioNoteStudyResult,
} from './audio-note-blocks-to-doc';

describe('studyNotesResultToTiptapDoc', () => {
  it('builds heading, paragraph, and bullet list', () => {
    const input: AudioNoteStudyResult = {
      title: 'Lecture 1',
      blocks: [
        { type: 'heading', level: 2, text: 'Key ideas' },
        { type: 'paragraph', text: 'Energy is conserved.' },
        {
          type: 'bulletList',
          items: ['First point', 'Second point'],
        },
      ],
    };
    const doc = studyNotesResultToTiptapDoc(input) as {
      type: string;
      content: Array<Record<string, unknown>>;
    };
    expect(doc.type).toBe('doc');
    expect(doc.content).toHaveLength(3);
    expect(doc.content[0]).toMatchObject({
      type: 'heading',
      attrs: { level: 2 },
    });
    expect(doc.content[1]).toMatchObject({ type: 'paragraph' });
    expect(doc.content[2]).toMatchObject({ type: 'bulletList' });
  });

  it('returns empty paragraph when blocks are empty', () => {
    const doc = studyNotesResultToTiptapDoc({
      title: 'T',
      blocks: [],
    }) as { content: unknown[] };
    expect(doc.content).toHaveLength(1);
    expect(doc.content[0]).toMatchObject({ type: 'paragraph', content: [] });
  });
});
