import { describe, expect, it } from 'vitest';
import {
  NOTA_NOTES_MAIN_CHROME_CLASS,
  NOTA_NOTES_SIDEBAR_CHROME_CLASS,
  notesMainChrome,
  notesSidebarChrome,
} from './notes-shell-chrome';

describe('notes shell chrome', () => {
  it('exposes stable marker classes for reduced-transparency CSS', () => {
    // Arrange
    const expectedSidebar = 'nota-notes-sidebar-chrome';
    const expectedMain = 'nota-notes-main-chrome';

    // Act & Assert
    expect(NOTA_NOTES_SIDEBAR_CHROME_CLASS).toBe(expectedSidebar);
    expect(NOTA_NOTES_MAIN_CHROME_CLASS).toBe(expectedMain);
  });

  it('applies glassmorphic backdrop blur to sidebar and main', () => {
    // Arrange
    const sidebarBlur = 'backdrop-blur-3xl';
    const mainBlur = 'backdrop-blur-xl';

    // Act
    const sidebar = notesSidebarChrome;
    const main = notesMainChrome;

    // Assert
    expect(sidebar).toContain(sidebarBlur);
    expect(main).toContain(mainBlur);
    expect(sidebar).toContain('backdrop-saturate-150');
    expect(main).toContain('backdrop-saturate-150');
  });

  it('uses a darker frosted rail for the sidebar than the main panel', () => {
    // Arrange
    const sidebarMarker = NOTA_NOTES_SIDEBAR_CHROME_CLASS;
    const mainMarker = NOTA_NOTES_MAIN_CHROME_CLASS;

    // Act
    const sidebar = notesSidebarChrome;
    const main = notesMainChrome;

    // Assert
    expect(sidebar).not.toBe(main);
    expect(sidebar).toContain(sidebarMarker);
    expect(sidebar).toContain('border-r');
    expect(sidebar).toContain('dark:bg-black/28');
    expect(main).toContain(mainMarker);
    expect(main).toContain('bg-background/48');
  });
});
