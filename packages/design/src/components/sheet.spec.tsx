import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet.js';

describe('Sheet', () => {
  it('opens from the trigger and shows the titled content', () => {
    // Arrange
    render(
      <Sheet>
        <SheetTrigger>Open preview</SheetTrigger>
        <SheetContent showCloseButton={false}>
          <SheetHeader>
            <SheetTitle>Invoice.pdf</SheetTitle>
          </SheetHeader>
          <SheetBody>Page one</SheetBody>
        </SheetContent>
      </Sheet>,
    );

    // Act
    expect(screen.queryByText('Page one')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open preview' }));

    // Assert
    expect(screen.getByRole('dialog', { name: 'Invoice.pdf' })).toBeTruthy();
    expect(screen.getByText('Page one')).toBeTruthy();
  });

  it('anchors to the requested side so the swipe direction matches', () => {
    // Arrange
    render(
      <Sheet side="bottom" defaultOpen>
        <SheetContent showCloseButton={false}>
          <SheetTitle>Capture</SheetTitle>
        </SheetContent>
      </Sheet>,
    );

    // Act
    const popup = screen.getByRole('dialog', { name: 'Capture' });

    // Assert
    expect(popup.getAttribute('data-swipe-direction')).toBe('down');
    expect(popup.className).toContain('rounded-t-2xl');
  });

  it('closes from the built-in close control', () => {
    // Arrange
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>Coastline.webp</SheetTitle>
        </SheetContent>
      </Sheet>,
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    // Assert
    expect(screen.queryByRole('dialog', { name: 'Coastline.webp' })).toBeNull();
  });
});
