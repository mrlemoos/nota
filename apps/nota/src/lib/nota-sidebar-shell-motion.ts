import { NOTA_SIDEBAR_SLIDE_PX } from '@/lib/nota-motion';

export type NotaSidebarAsideMotionTargets = {
  width: number;
  opacity: number;
  x: number;
};

/** GSAP end-state for the notes shell sidebar rail (width, fade, slide). */
export function getNotaSidebarAsideMotionTargets(params: {
  open: boolean;
  widthPx: number;
  prefersReducedMotion: boolean;
}): NotaSidebarAsideMotionTargets {
  const { open, widthPx, prefersReducedMotion } = params;

  return {
    width: open ? widthPx : 0,
    opacity: open ? 1 : 0,
    x: open || prefersReducedMotion ? 0 : -NOTA_SIDEBAR_SLIDE_PX,
  };
}
