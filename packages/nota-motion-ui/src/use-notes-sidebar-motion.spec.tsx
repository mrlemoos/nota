import { render } from '@testing-library/react';
import type { JSX } from 'react';
import { describe, expect, it } from 'vitest';
import {
  markSidebarMotionIntent,
  resetSidebarMotionIntent,
} from './sidebar-motion-intent';
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

  it('briefly animates rail exit for a pointer close', () => {
    // Arrange
    resetSidebarMotionIntent();
    const { container, rerender } = render(
      <Harness open widthPx={288} mounted />,
    );
    const aside = container.querySelector('aside');
    const rail = findRail(container);
    markSidebarMotionIntent('pointer');

    // Act
    rerender(<Harness open={false} widthPx={288} mounted />);

    // Assert
    expect(aside?.style.width).toBe('288px');
    expect(rail.style.transition).toBe(
      'transform 120ms var(--ease-out), opacity 120ms var(--ease-out)',
    );
    expect(rail.style.transform).toBe('translateX(-12px)');
    expect(rail.style.opacity).toBe('0');
  });

  it('collapses clip when the pointer-close opacity transition ends', () => {
    // Arrange
    resetSidebarMotionIntent();
    const { container, rerender } = render(
      <Harness open widthPx={288} mounted />,
    );
    const aside = container.querySelector('aside');
    const rail = findRail(container);
    markSidebarMotionIntent('pointer');
    rerender(<Harness open={false} widthPx={288} mounted />);

    // Act
    rail.dispatchEvent(
      Object.assign(new Event('transitionend'), { propertyName: 'opacity' }),
    );

    // Assert
    expect(aside?.style.width).toBe('0px');
  });

  it('waits for opacity when transform transition ends first', () => {
    // Arrange
    resetSidebarMotionIntent();
    const { container, rerender } = render(
      <Harness open widthPx={288} mounted />,
    );
    const aside = container.querySelector('aside');
    const rail = findRail(container);
    markSidebarMotionIntent('pointer');
    rerender(<Harness open={false} widthPx={288} mounted />);

    // Act
    rail.dispatchEvent(
      Object.assign(new Event('transitionend'), { propertyName: 'transform' }),
    );

    // Assert
    expect(aside?.style.width).toBe('288px');

    // Act
    rail.dispatchEvent(
      Object.assign(new Event('transitionend'), { propertyName: 'opacity' }),
    );

    // Assert
    expect(aside?.style.width).toBe('0px');
  });

  it('does not collapse after a pointer close is interrupted by re-open', () => {
    // Arrange
    resetSidebarMotionIntent();
    const { container, rerender } = render(
      <Harness open widthPx={288} mounted />,
    );
    const aside = container.querySelector('aside');
    const rail = findRail(container);
    markSidebarMotionIntent('pointer');
    rerender(<Harness open={false} widthPx={288} mounted />);
    markSidebarMotionIntent('pointer');
    rerender(<Harness open widthPx={288} mounted />);

    // Act
    rail.dispatchEvent(
      Object.assign(new Event('transitionend'), { propertyName: 'opacity' }),
    );

    // Assert
    expect(aside?.style.width).toBe('288px');
  });

  it('keeps keyboard close instant', () => {
    // Arrange
    resetSidebarMotionIntent();
    const { container, rerender } = render(
      <Harness open widthPx={288} mounted />,
    );
    const aside = container.querySelector('aside');
    const rail = findRail(container);

    // Act
    rerender(<Harness open={false} widthPx={288} mounted />);

    // Assert
    expect(aside?.style.width).toBe('0px');
    expect(rail.style.transition).toBe('none');
  });
});
