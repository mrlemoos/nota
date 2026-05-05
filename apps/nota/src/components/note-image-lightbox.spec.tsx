import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { isElectronMock } = vi.hoisted(() => ({
  isElectronMock: vi.fn(() => false),
}));

vi.mock('@/lib/use-is-electron', () => ({
  useIsElectron: () => isElectronMock(),
}));

// eslint-disable-next-line import/first -- Vitest: vi.mock is hoisted; SUT must load after mock factory.
import { NoteImageLightbox } from './note-image-lightbox';

describe('NoteImageLightbox', () => {
  it('renders full-screen image metadata and closes on close button', () => {
    // Arrange
    const onClose = vi.fn();

    render(
      <NoteImageLightbox
        open
        image={{
          src: 'https://cdn.example.test/photo.webp',
          alt: 'Coastline at dusk',
          filename: 'Coastline.webp',
        }}
        onClose={onClose}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: /close image view/i }));

    // Assert
    expect(screen.getByRole('img', { name: 'Coastline at dusk' })).toBeTruthy();
    expect(screen.getByText('Coastline.webp')).toBeTruthy();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click and Escape key', () => {
    // Arrange
    const onClose = vi.fn();

    render(
      <NoteImageLightbox
        open
        image={{
          src: 'https://cdn.example.test/photo.webp',
          alt: 'Coastline at dusk',
          filename: 'Coastline.webp',
        }}
        onClose={onClose}
      />,
    );

    // Act
    fireEvent.click(screen.getByTestId('note-image-lightbox-backdrop'));
    fireEvent.keyDown(document, { key: 'Escape' });

    // Assert
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('adds traffic-light spacing when running in Electron', () => {
    // Arrange
    isElectronMock.mockReturnValue(true);

    render(
      <NoteImageLightbox
        open
        image={{
          src: 'https://cdn.example.test/photo.webp',
          alt: 'Coastline at dusk',
          filename: 'Coastline.webp',
        }}
        onClose={() => {}}
      />,
    );

    // Act
    const filenameLabel = screen.getByText('Coastline.webp');

    // Assert
    expect(filenameLabel.closest('header')?.className).toContain('pl-20');
  });
});
