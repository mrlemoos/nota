import { cn } from '@/lib/utils';

/** Target for `prefers-reduced-transparency` overrides in `styles.css`. */
export const NOTA_NOTES_SIDEBAR_CHROME_CLASS = 'nota-notes-sidebar-chrome';

/** Target for `prefers-reduced-transparency` overrides in `styles.css`. */
export const NOTA_NOTES_MAIN_CHROME_CLASS = 'nota-notes-main-chrome';

/**
 * Glassmorphic chrome for the notes sidebar rail: darker tint than main, stronger blur,
 * subtle right edge. Electron vibrancy + `backdrop-filter` stack for wallpaper bleed-through.
 */
export const notesSidebarChrome = cn(
  NOTA_NOTES_SIDEBAR_CHROME_CLASS,
  'border-r border-sidebar-border/70',
  'bg-sidebar/42 dark:border-white/10 dark:bg-black/28',
  'backdrop-blur-3xl backdrop-saturate-150',
  'text-foreground',
);

/**
 * Glassmorphic chrome for the notes main panel: frosted but slightly brighter / milder blur
 * than the sidebar so the editor stays readable.
 */
export const notesMainChrome = cn(
  NOTA_NOTES_MAIN_CHROME_CLASS,
  'bg-background/48 dark:bg-background/38',
  'backdrop-blur-xl backdrop-saturate-150',
  'text-foreground',
);
