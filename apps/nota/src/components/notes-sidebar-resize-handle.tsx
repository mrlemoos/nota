import type { JSX, PointerEvent as ReactPointerEvent } from 'react';
import { ELECTRON_WINDOW_NO_DRAG_CLASS } from '@/lib/electron-window-chrome';
import { cn } from '@/lib/utils';

export function NotesSidebarResizeHandle({
  ariaLabel,
  onPointerDown,
}: {
  ariaLabel: string;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
}): JSX.Element {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      tabIndex={-1}
      onPointerDown={onPointerDown}
      className={cn(
        'nota-sidebar-resize-handle',
        ELECTRON_WINDOW_NO_DRAG_CLASS,
      )}
    />
  );
}
