import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarToggle } from './notes-shell-parts';
import { useNotesSidebarStore } from '../stores/notes-sidebar';

vi.mock('@/lib/use-nota-translator', () => ({
  useNotaTranslator: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../lib/use-is-electron', () => ({
  useIsElectron: () => false,
}));

describe('SidebarToggle', () => {
  beforeEach(() => {
    useNotesSidebarStore.setState({ open: true });
  });

  it('calls toggle when the button is clicked', () => {
    // Arrange
    const toggle = vi.fn();
    useNotesSidebarStore.setState({ open: true, toggle });

    // Act
    render(<SidebarToggle />);
    fireEvent.click(screen.getByRole('button', { name: 'Close sidebar' }));

    // Assert
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('reflects the open state in aria-expanded', () => {
    // Arrange
    useNotesSidebarStore.setState({ open: false });

    // Act
    render(<SidebarToggle />);

    // Assert
    expect(
      screen
        .getByRole('button', { name: 'Open sidebar' })
        .getAttribute('aria-expanded'),
    ).toBe('false');
  });
});
