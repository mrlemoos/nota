import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  detectAppleShortcutPlatform,
  formatMetaShortcut,
  useMetaShortcutKey,
} from './use-meta-shortcut-key.js';

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('formatMetaShortcut', () => {
  it('formats Apple meta shortcuts without separators', () => {
    // Arrange
    const isApple = true;

    // Act & Assert
    expect(formatMetaShortcut(isApple, { key: 'N' })).toBe('⌘N');
    expect(formatMetaShortcut(isApple, { key: 'D' })).toBe('⌘D');
    expect(formatMetaShortcut(isApple, { key: '[', shift: true })).toBe('⇧⌘[');
  });

  it('formats Windows meta shortcuts with plus separators', () => {
    // Arrange
    const isApple = false;

    // Act & Assert
    expect(formatMetaShortcut(isApple, { key: 'N' })).toBe('Ctrl+N');
    expect(formatMetaShortcut(isApple, { key: 'D' })).toBe('Ctrl+D');
    expect(formatMetaShortcut(isApple, { key: 'N', shift: true })).toBe(
      'Ctrl+Shift+N',
    );
  });
});

describe('detectAppleShortcutPlatform', () => {
  it('returns false when navigator is unavailable', () => {
    // Arrange
    vi.stubGlobal('navigator', undefined);

    // Act
    const result = detectAppleShortcutPlatform();

    // Assert
    expect(result).toBe(false);
  });

  it('detects Mac hardware and Mac OS X user agents', () => {
    // Arrange
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    });

    // Act
    const result = detectAppleShortcutPlatform();

    // Assert
    expect(result).toBe(true);
  });
});

describe('useMetaShortcutKey', () => {
  it('updates formatShortcut after layout when UA is non-Apple', async () => {
    // Arrange
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });

    // Act
    const { result } = renderHook(() => useMetaShortcutKey());

    // Assert
    await waitFor(() => {
      expect(result.current.isApple).toBe(false);
    });
    expect(result.current.modChar).toBe('Ctrl');
    expect(result.current.formatShortcut({ key: 'K' })).toBe('Ctrl+K');
  });
});
