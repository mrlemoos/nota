import { render } from '@testing-library/react';
import type { JSX } from 'react';
import { describe, expect, it } from 'vitest';
import { useNotesSidebarMotion } from './use-notes-sidebar-motion';

function Harness(props: {
  open: boolean;
  widthPx: number;
  mounted: boolean;
}): JSX.Element {
  const { asideRef, railRef } = useNotesSidebarMotion(props);
  return (
    <aside ref={asideRef}>
      <div ref={railRef} />
    </aside>
  );
}

function findRail(container: HTMLElement): HTMLElement {
  const rail = container.querySelector('aside > div');
  if (!(rail instanceof HTMLElement)) {
    throw new Error('rail element not found');
  }
  return rail;
}

describe('useNotesSidebarMotion', () => {
  it('keeps the first sidebar paint instant', () => {
    // Arrange + Act
    const { container } = render(<Harness open widthPx={288} mounted />);
    const rail = findRail(container);

    // Assert
    expect(rail.style.transition).toBe('none');
  });

  it('animates the sidebar boundary and rail together on close', () => {
    // Arrange
    const { container, rerender } = render(
      <Harness open widthPx={288} mounted />,
    );
    const aside = container.querySelector('aside');
    const rail = findRail(container);

    // Act
    rerender(<Harness open={false} widthPx={288} mounted />);

    // Assert
    expect(aside?.style.width).toBe('0px');
    expect(aside?.style.transition).toBe('width 240ms var(--ease-in-out)');
    expect(rail.style.transition).toBe(
      'transform 240ms var(--ease-in-out), opacity 120ms var(--ease-out)',
    );
    expect(rail.style.transform).toBe('translateX(-12px)');
    expect(rail.style.opacity).toBe('0');
  });

  it('animates the sidebar boundary and rail together on open', () => {
    // Arrange
    const { container, rerender } = render(
      <Harness open={false} widthPx={288} mounted />,
    );
    const aside = container.querySelector('aside');
    const rail = findRail(container);

    // Act
    rerender(<Harness open widthPx={288} mounted />);

    // Assert
    expect(aside?.style.width).toBe('288px');
    expect(aside?.style.transition).toBe('width 280ms var(--ease-in-out)');
    expect(rail.style.transition).toBe(
      'transform 280ms var(--ease-in-out), opacity 160ms var(--ease-out)',
    );
    expect(rail.style.transform).toBe('translateX(0px)');
    expect(rail.style.opacity).toBe('1');
  });

  it('does not collapse after a close is interrupted by re-open', () => {
    // Arrange
    const { container, rerender } = render(
      <Harness open widthPx={288} mounted />,
    );
    const aside = container.querySelector('aside');
    rerender(<Harness open={false} widthPx={288} mounted />);
    rerender(<Harness open widthPx={288} mounted />);

    // Assert
    expect(aside?.style.width).toBe('288px');
    expect(aside?.style.transition).toBe('width 280ms var(--ease-in-out)');
  });

  it('animates a shortcut-triggered close', () => {
    // Arrange
    const { container, rerender } = render(
      <Harness open widthPx={288} mounted />,
    );
    const aside = container.querySelector('aside');
    const rail = findRail(container);

    // Act
    rerender(<Harness open={false} widthPx={288} mounted />);

    // Assert
    expect(aside?.style.width).toBe('0px');
    expect(aside?.style.transition).toBe('width 240ms var(--ease-in-out)');
    expect(rail.style.transition).toBe(
      'transform 240ms var(--ease-in-out), opacity 120ms var(--ease-out)',
    );
  });
});
