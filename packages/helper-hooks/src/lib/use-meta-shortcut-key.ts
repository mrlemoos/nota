import { useCallback, useLayoutEffect, useState } from 'react';

export type MetaShortcutFormatOptions = {
  key: string;
  shift?: boolean;
  alt?: boolean;
};

/** Apple-style hardware / UA detection for shortcut labelling (SSR-safe). */
export function detectAppleShortcutPlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return (
    /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    /\bMac OS X\b/i.test(navigator.userAgent)
  );
}

/** Format a meta-style shortcut label for the current platform style. */
export function formatMetaShortcut(
  isApple: boolean,
  { key, shift = false, alt = false }: MetaShortcutFormatOptions,
): string {
  if (isApple) {
    let label = '';
    if (shift) {
      label += '⇧';
    }
    if (alt) {
      label += '⌥';
    }
    label += '⌘';
    return label + key;
  }

  const parts: string[] = ['Ctrl'];
  if (shift) {
    parts.push('Shift');
  }
  if (alt) {
    parts.push('Alt');
  }
  parts.push(key);
  return parts.join('+');
}

export type UseMetaShortcutKeyResult = {
  isApple: boolean;
  modChar: '⌘' | 'Ctrl';
  formatShortcut: (options: MetaShortcutFormatOptions) => string;
};

/**
 * Resolves whether meta shortcuts should display as ⌘ (Apple) or Ctrl (other),
 * and formats shortcut labels for palette hints and settings copy.
 */
export function useMetaShortcutKey(): UseMetaShortcutKeyResult {
  const [isApple, setIsApple] = useState(true);

  useLayoutEffect(() => {
    setIsApple(detectAppleShortcutPlatform());
  }, []);

  const formatShortcut = useCallback(
    (options: MetaShortcutFormatOptions) =>
      formatMetaShortcut(isApple, options),
    [isApple],
  );

  return {
    isApple,
    modChar: isApple ? '⌘' : 'Ctrl',
    formatShortcut,
  };
}
