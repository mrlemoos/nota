/** True when keyboard shortcuts should defer to the field (matches command palette behavior). */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  if (target.closest('[contenteditable="true"]')) {
    return true;
  }
  if (target.closest('.tiptap-editor')) {
    return true;
  }
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  return target.closest('input, textarea, select') !== null;
}
