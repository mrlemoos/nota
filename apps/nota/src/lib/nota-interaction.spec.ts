import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  NOTA_CMDK_ITEM_CLASS,
  NOTA_PRESSABLE_CLASS,
  NOTA_SAVE_PULSE_CLASS,
  NOTA_SHELL_NAV_ITEM_CLASS,
  NOTA_SIDEBAR_ROW_CLASS,
} from './nota-interaction';

const stylesCss = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../styles.css'),
  'utf8',
);

// Arrange: exported class tokens and styles.css hooks
// Act + Assert: micro-interactions stay discoverable and respect reduced motion
describe('nota-interaction', () => {
  it('exports stable class names for shell micro-interactions', () => {
    expect(NOTA_PRESSABLE_CLASS).toBe('nota-pressable');
    expect(NOTA_SHELL_NAV_ITEM_CLASS).toBe('nota-shell-nav-item');
    expect(NOTA_SIDEBAR_ROW_CLASS).toBe('nota-sidebar-row');
    expect(NOTA_SAVE_PULSE_CLASS).toBe('nota-save-pulse');
    expect(NOTA_CMDK_ITEM_CLASS).toBe('nota-cmdk-item');
  });

  it('defines press-only feedback and reduced-motion guards in styles.css', () => {
    for (const className of [
      NOTA_PRESSABLE_CLASS,
      NOTA_SHELL_NAV_ITEM_CLASS,
      NOTA_SIDEBAR_ROW_CLASS,
      NOTA_SAVE_PULSE_CLASS,
      NOTA_CMDK_ITEM_CLASS,
    ]) {
      expect(stylesCss).toContain(`.${className}`);
    }
    expect(stylesCss).toMatch(
      new RegExp(`\\.${NOTA_PRESSABLE_CLASS}:active[\\s\\S]*scale\\(0\\.98\\)`),
    );
    expect(stylesCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(stylesCss).toMatch(
      new RegExp(
        `\\.${NOTA_SAVE_PULSE_CLASS}[\\s\\S]*@media \\(prefers-reduced-motion: reduce\\)`,
      ),
    );
  });
});
