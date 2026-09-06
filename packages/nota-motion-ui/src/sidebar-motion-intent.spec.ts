import { describe, expect, it } from 'vitest';
import {
  consumeSidebarMotionIntent,
  markSidebarMotionIntent,
  resetSidebarMotionIntent,
} from './sidebar-motion-intent';

describe('sidebar motion intent', () => {
  it('consumes pointer intent once, then defaults to keyboard', () => {
    // Arrange
    resetSidebarMotionIntent();
    markSidebarMotionIntent('pointer');

    // Act
    const first = consumeSidebarMotionIntent();
    const second = consumeSidebarMotionIntent();

    // Assert
    expect(first).toBe('pointer');
    expect(second).toBe('keyboard');
  });
});
