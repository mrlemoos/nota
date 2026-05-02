import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NotesGraphScreen } from './notes-graph-screen';

function noopT(key: string): string {
  return key;
}

describe('NotesGraphScreen', () => {
  it('renders title and description', () => {
    // Arrange
    const onOpenNote = vi.fn((_noteId: string) => undefined);
    // Act
    render(<NotesGraphScreen notes={[]} onOpenNote={onOpenNote} t={noopT} />);

    // Assert
    expect(screen.getByRole('heading', { name: 'Note Graph' })).toBeTruthy();
    expect(
      screen.getByText(
        'How your notes link together. Click a note to open it. Pan and zoom to explore.',
      ),
    ).toBeTruthy();
  });
});
