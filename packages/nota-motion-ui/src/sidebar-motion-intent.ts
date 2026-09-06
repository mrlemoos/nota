export type SidebarMotionIntent = 'pointer' | 'keyboard';

let pendingSidebarMotionIntent: SidebarMotionIntent = 'keyboard';

export function markSidebarMotionIntent(intent: SidebarMotionIntent): void {
  pendingSidebarMotionIntent = intent;
}

export function consumeSidebarMotionIntent(): SidebarMotionIntent {
  const intent = pendingSidebarMotionIntent;
  pendingSidebarMotionIntent = 'keyboard';
  return intent;
}

/** Test helper — reset the shared register to its safe default. */
export function resetSidebarMotionIntent(): void {
  pendingSidebarMotionIntent = 'keyboard';
}
