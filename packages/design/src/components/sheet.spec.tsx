import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

describe('Sheet chrome styles', () => {
  it('opts the sheet out of the Electron window drag region', () => {
    // Arrange — the floating controls sit inside the top drag band, and a
    // draggable region eats clicks unless the surface opts back out.
    const themeChrome = readFileSync(
      resolve(process.cwd(), 'src/theme-chrome.css'),
      'utf8',
    );

    // Act
    const rule =
      /\.nota-sheet-popup,\s*\n\.nota-sheet-backdrop\s*\{[\s\S]*?-webkit-app-region:\s*no-drag/;

    // Assert
    expect(themeChrome).toMatch(rule);
  });
});
