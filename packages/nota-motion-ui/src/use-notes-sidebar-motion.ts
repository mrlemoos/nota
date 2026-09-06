import { useLayoutEffect, useRef } from 'react';
import { NOTA_SIDEBAR_REVEAL_PX } from './nota-motion';
import { NOTA_SIDEBAR_COLLAPSED_CLIP_WIDTH_PX } from '@getmadrid/nota-motion-core/sidebar-width';
import { consumeSidebarMotionIntent } from './sidebar-motion-intent';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

const SIDEBAR_OPEN_TRANSITION =
  'transform 160ms var(--ease-out), opacity 160ms var(--ease-out)';
const SIDEBAR_CLOSE_TRANSITION =
  'transform 120ms var(--ease-out), opacity 120ms var(--ease-out)';

export type NotesSidebarMotion = {
  asideRef: React.RefObject<HTMLElement | null>;
  railRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Pointer toggles briefly move the rail while the editor layout snaps. Keyboard
 * and reduced-motion toggles stay instant.
 */
export function useNotesSidebarMotion(params: {
  open: boolean;
  widthPx: number;
  mounted: boolean;
}): NotesSidebarMotion {
  const { open, widthPx, mounted } = params;
  const asideRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const motionReadyRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const aside = asideRef.current;
    const rail = railRef.current;
    if (!mounted) {
      motionReadyRef.current = false;
      return;
    }
    if (!aside || !rail) {
      return;
    }

    const layout = (isOpen: boolean) => {
      aside.style.width = `${isOpen ? widthPx : NOTA_SIDEBAR_COLLAPSED_CLIP_WIDTH_PX}px`;
      aside.style.maxWidth = isOpen ? `${widthPx}px` : 'none';
    };
    const setRail = (isOpen: boolean, transition: string) => {
      rail.style.transition = transition;
      rail.style.transform = `translateX(${isOpen ? 0 : -NOTA_SIDEBAR_REVEAL_PX}px)`;
      rail.style.opacity = isOpen ? '1' : '0';
    };
    const intent = motionReadyRef.current
      ? consumeSidebarMotionIntent()
      : 'keyboard';
    const pointerMotion = !prefersReducedMotion && intent === 'pointer';

    motionReadyRef.current = true;

    if (!pointerMotion) {
      layout(open);
      setRail(open, 'none');
      return;
    }

    if (open) {
      layout(true);
      setRail(true, SIDEBAR_OPEN_TRANSITION);
      return;
    }

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName === 'opacity') {
        rail.removeEventListener('transitionend', onTransitionEnd);
        layout(false);
      }
    };

    rail.addEventListener('transitionend', onTransitionEnd);
    setRail(false, SIDEBAR_CLOSE_TRANSITION);
    return () => {
      rail.removeEventListener('transitionend', onTransitionEnd);
    };
  }, [mounted, open, prefersReducedMotion, widthPx]);

  return { asideRef, railRef };
}
