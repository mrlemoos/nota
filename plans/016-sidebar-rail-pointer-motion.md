# 016 — Restore brief pointer-only sidebar rail motion

- **Status**: DONE
- **Commit**: 42e5cf7
- **Severity**: MEDIUM
- **Category**: Missed opportunity and interruptibility
- **Estimated scope**: 4 files, ~90 lines

## Problem

`packages/nota-motion-ui/src/use-notes-sidebar-motion.ts:25-28` snaps the clip, rail transform, and opacity in one layout effect:

```ts
aside.style.width = `${open ? widthPx : NOTA_SIDEBAR_COLLAPSED_CLIP_WIDTH_PX}px`;
aside.style.maxWidth = open ? `${widthPx}px` : 'none';
rail.style.transform = `translateX(${open ? 0 : -NOTA_SIDEBAR_SLIDE_PX}px)`;
rail.style.opacity = open ? '1' : '0';
```

The sidebar teleports when a pointer clicks its control. That loses spatial feedback. Plan 004 remains correct: do not animate `aside` width. Its old 0.3s spring still felt wrong because close held layout until spring completion, then main content snapped.

`packages/app-navigation-ui/src/use-notes-sidebar-shortcut.ts:28` calls `toggle()` from Cmd/Ctrl+S. Keyboard toggles must remain instant.

## Target

For pointer toggles only:

- Open: snap clip width to `widthPx`, then transition rail from `translateX(-12px)` and `opacity: 0` to `translateX(0)` and `opacity: 1` over `160ms` with `var(--ease-out)` (`cubic-bezier(0.23, 1, 0.32, 1)`).
- Close: transition rail to `translateX(-12px)` and `opacity: 0` over `120ms` with same easing. Once opacity has reached zero, snap clip width to `0`.
- Retoggle mid-flight: CSS transition retargets from its current transform and opacity. Never use a keyframe or rAF spring.
- Keyboard toggles, initial render, and `prefers-reduced-motion: reduce`: snap clip and rail. No movement.
- Never transition `width`, `max-width`, `height`, or a parent CSS variable.

```css
/* target declarations on the rail */
transition:
  transform 160ms var(--ease-out),
  opacity 160ms var(--ease-out);
```

For close, override only duration to `120ms`. Reduced motion must set `transition: none` and preserve the final opacity.

## Repo conventions to follow

- `packages/design/src/theme-chrome.css:9-10` defines `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.
- `packages/nota-motion-ui/src/use-prefers-reduced-motion.ts` is the existing SSR-safe reduced-motion hook.
- `packages/nota-motion-ui/src/panel-motion.ts` has the existing ephemeral intent pattern. Follow it; do not persist motion intent in `nota-notes-sidebar`.
- Tests use AAA comments, as in `packages/nota-motion-ui/src/use-notes-sidebar-motion.spec.tsx`.

## Steps

1. Add `packages/nota-motion-ui/src/sidebar-motion-intent.ts`. Export `markSidebarMotionIntent('pointer' | 'keyboard')` and `consumeSidebarMotionIntent()`. Default consumed intent to `keyboard`. Store module-local state only.
2. In `packages/notes-chrome-ui/src/notes-chrome-parts.tsx`, call `markSidebarMotionIntent('pointer')` immediately before sidebar `toggle()` in `SidebarToggle` and collapsed-edge click handlers.
3. In `packages/app-navigation-ui/src/use-notes-sidebar-shortcut.ts`, call `markSidebarMotionIntent('keyboard')` immediately before `useNotesSidebarStore.getState().toggle()`.
4. In `packages/nota-motion-ui/src/use-notes-sidebar-motion.ts`, restore `usePrefersReducedMotion`. On state changes, consume intent. Add direct rail transition declarations only for pointer intent without reduced motion. Set clip width before pointer-open transition. For pointer-close, listen once for the rail `transitionend` event for `opacity`; then set clip width to zero. Clear the listener on effect cleanup or a rapid re-open.
5. Use `NOTA_SIDEBAR_SLIDE_PX = 12` for this interaction, or introduce a sidebar-specific `NOTA_SIDEBAR_REVEAL_PX = 12` next to it. Do not change global spring tokens.
6. Update `use-notes-sidebar-motion.spec.tsx` for pointer open/close transition styles, keyboard instant styles, reduced-motion instant styles, and a rapid reopen cancelling the close completion.
7. Add focused intent tests beside `sidebar-motion-intent.ts`.

## Boundaries

- Do not animate sidebar width or main width.
- Do not modify sidebar persistence, resize handling, TipTap, command palette, or folder tree motion.
- Do not add dependencies.
- Do not bring back `animateSprings`, GSAP, or a 0.3s spring for this control.

## Verification

- **Mechanical:** `pnpm exec nx run @getmadrid/nota-motion-ui:test-ci--src/use-notes-sidebar-motion.spec.tsx --outputStyle=static`; if Nx still rejects generated target schema, run its exact Vitest command in `packages/nota-motion-ui`. Run `pnpm exec prettier --check src/use-notes-sidebar-motion.ts src/use-notes-sidebar-motion.spec.tsx` there.
- **Feel check:** in Electron, pointer-toggle the sidebar ten times. Open should reveal from left without a pause; close should fade and move a small amount before main claims space. Cmd/Ctrl+S must snap. With reduced motion enabled, all movement must disappear.
- **Done when:** no width transition appears in DevTools Animations; no close completion collapses a sidebar that has already re-opened; pointer interaction feels present but stays under 160ms.
