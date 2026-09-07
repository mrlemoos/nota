import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NoteImageLightbox } from './note-image-lightbox';

const image = {
  src: 'https://cdn.example.test/photo.webp',
  alt: 'Coastline at dusk',
  filename: 'Coastline.webp',
};

describe('NoteImageLightbox', () => {
  it('renders nothing until an image is given', () => {
    // Arrange
    render(<NoteImageLightbox open={false} image={null} onClose={() => {}} />);

    // Act
    const dialog = screen.queryByRole('dialog');

    // Assert
    expect(dialog).toBeNull();
  });

  it('renders the image and filename in a right-anchored sheet', () => {
    // Arrange
    render(<NoteImageLightbox open image={image} onClose={() => {}} />);

    // Act
    const sheet = screen.getByTestId('note-image-lightbox');

    // Assert
    expect(sheet.getAttribute('data-swipe-direction')).toBe('right');
    expect(screen.getByRole('img', { name: 'Coastline at dusk' })).toBeTruthy();
    expect(screen.getByText('Coastline.webp')).toBeTruthy();
  });

  it('closes from the close control', () => {
    // Arrange
    const onClose = vi.fn();
    render(<NoteImageLightbox open image={image} onClose={onClose} />);

    // Act
    fireEvent.click(screen.getByRole('button', { name: /close image view/i }));

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', () => {
    // Arrange
    const onClose = vi.fn();
    render(<NoteImageLightbox open image={image} onClose={onClose} />);

    // Act
    fireEvent.keyDown(document, { key: 'Escape' });

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
