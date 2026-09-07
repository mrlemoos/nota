import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Popover, PopoverContent, PopoverTrigger } from './popover.js';

describe('PopoverContent (rendering)', () => {
  it('renders the popup content when open', () => {
    // Arrange / Act
    const { baseElement } = render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent side="bottom" align="end">
          Popover body
        </PopoverContent>
      </Popover>,
    );

    // Assert
    expect(
      within(baseElement).getByText('Popover body', { exact: true }),
    ).toBeTruthy();
  });

  it('keeps the trigger-origin motion contract on the popup', () => {
    // Arrange
    const { baseElement } = render(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Body</PopoverContent>
      </Popover>,
    );

    // Act
    const popup = baseElement.querySelector('[data-slot="popover-popup"]');

    // Assert
    expect(popup?.className).toContain('origin-[var(--transform-origin)]');
    expect(popup?.className).toContain('data-[starting-style]:scale-95');
  });
});
