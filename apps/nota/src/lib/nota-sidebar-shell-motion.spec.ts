import { describe, expect, it } from 'vitest';
import { NOTA_SIDEBAR_SLIDE_PX } from './nota-motion';
import { getNotaSidebarAsideMotionTargets } from './nota-sidebar-shell-motion';

describe('getNotaSidebarAsideMotionTargets', () => {
  it('returns full width, opaque, and aligned when the sidebar is open', () => {
    // Arrange
    const widthPx = 320;

    // Act
    const targets = getNotaSidebarAsideMotionTargets({
      open: true,
      widthPx,
      prefersReducedMotion: false,
    });

    // Assert
    expect(targets).toEqual({ width: 320, opacity: 1, x: 0 });
  });

  it('slides left and fades out when the sidebar is closed', () => {
    // Arrange
    const widthPx = 288;

    // Act
    const targets = getNotaSidebarAsideMotionTargets({
      open: false,
      widthPx,
      prefersReducedMotion: false,
    });

    // Assert
    expect(targets).toEqual({
      width: 0,
      opacity: 0,
      x: -NOTA_SIDEBAR_SLIDE_PX,
    });
  });

  it('omits horizontal slide when reduced motion is preferred', () => {
    // Arrange
    const widthPx = 288;

    // Act
    const closed = getNotaSidebarAsideMotionTargets({
      open: false,
      widthPx,
      prefersReducedMotion: true,
    });
    const open = getNotaSidebarAsideMotionTargets({
      open: true,
      widthPx,
      prefersReducedMotion: true,
    });

    // Assert
    expect(closed.x).toBe(0);
    expect(open.x).toBe(0);
  });
});
