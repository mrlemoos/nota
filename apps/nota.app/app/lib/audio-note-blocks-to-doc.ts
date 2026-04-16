import type { Json } from '~/types/database.types';

/** Mirrors JSON from `POST /api/audio-to-note` event `notes_done` (nota-server xAI pipeline). */
export type AudioNoteBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bulletList'; items: string[] };

export type AudioNoteStudyResult = {
  title: string;
  blocks: AudioNoteBlock[];
};

function textNode(text: string): Record<string, unknown> {
  return { type: 'text', text };
}

/**
 * Converts assistive-capture study-note blocks to TipTap / StarterKit-compatible JSON.
 */
export function studyNotesResultToTiptapDoc(result: AudioNoteStudyResult): Json {
  const content: Record<string, unknown>[] = [];

  for (const block of result.blocks) {
    if (block.type === 'heading') {
      content.push({
        type: 'heading',
        attrs: { level: block.level },
        content: block.text.trim()
          ? [textNode(block.text.trim())]
          : [],
      });
      continue;
    }
    if (block.type === 'paragraph') {
      const t = block.text.trim();
      content.push({
        type: 'paragraph',
        content: t ? [textNode(t)] : [],
      });
      continue;
    }
    if (block.type === 'bulletList') {
      content.push({
        type: 'bulletList',
        content: block.items.map((item) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: item.trim() ? [textNode(item.trim())] : [],
            },
          ],
        })),
      });
    }
  }

  return {
    type: 'doc',
    content:
      content.length > 0
        ? content
        : [{ type: 'paragraph', content: [] }],
  } as Json;
}
