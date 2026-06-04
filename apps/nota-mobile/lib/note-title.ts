/** Display title for sidebar / list (matches web `persistedDisplayTitle`). */
export function displayNoteTitle(raw: string | null | undefined): string {
  const t = (raw ?? '').trim();
  return t.length > 0 ? t : 'Untitled Note';
}
