/**
 * Pinch-to-zoom for the attachment preview sheets (PDF pages, images).
 *
 * @remarks
 * The arithmetic is separated from the hook so the gesture maths is testable
 * without a canvas or a real trackpad.
 *
 * @packageDocumentation
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

/** Fully zoomed out: content half the width of the sheet. */
export const PINCH_ZOOM_MIN = 0.5;

/** Fully zoomed in. Past this the source bitmap softens. */
export const PINCH_ZOOM_MAX = 4;

/** Neutral zoom: content is exactly as wide as the sheet. */
export const PINCH_ZOOM_DEFAULT = 1;

/** How long the zoom readout stays up after the last change. */
const ZOOM_READOUT_MS = 900;

export function clampPinchZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) {
    return PINCH_ZOOM_DEFAULT;
  }
  return Math.min(PINCH_ZOOM_MAX, Math.max(PINCH_ZOOM_MIN, zoom));
}

/**
 * Next zoom level for one pinch/ctrl-wheel notch.
 *
 * @remarks
 * macOS trackpad pinch arrives as a `wheel` event with `ctrlKey` set (Chromium
 * and WebKit both do this), so the same path serves pinch and Ctrl/Cmd+wheel.
 * The step is exponential, which is what makes a pinch feel linear: each notch
 * changes the zoom by a constant *ratio*, so zooming 1 → 2 takes the same
 * gesture distance as 2 → 4.
 *
 * @param zoom - current zoom level
 * @param deltaY - `WheelEvent.deltaY` (negative when pinching open)
 */
export function pinchZoomAfterWheel(zoom: number, deltaY: number): number {
  if (!Number.isFinite(deltaY)) {
    return clampPinchZoom(zoom);
  }
  return clampPinchZoom(zoom * Math.exp(-deltaY / 120));
}

/** `1.5` → `"150%"`, for the transient zoom readout. */
export function formatPinchZoom(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

export type UsePinchZoomResult = {
  /** Current zoom level, `1` being fit-to-width. */
  zoom: number;
  /** Whether the transient percentage readout should be showing. */
  readoutVisible: boolean;
  /** Back to fit-to-width without flashing the readout. */
  reset: () => void;
};

/**
 * Wires trackpad pinch on a scroll container to a zoom level.
 *
 * @remarks
 * The listener is attached by hand rather than via `onWheel` because it must
 * not be passive: without `preventDefault` the browser zooms the whole window
 * instead of the content.
 *
 * @param scrollRootRef - element the gesture is read from
 * @param active - `false` unsubscribes and parks the zoom at neutral
 */
export function usePinchZoom(
  scrollRootRef: RefObject<HTMLElement | null>,
  active: boolean,
): UsePinchZoomResult {
  const [zoom, setZoom] = useState(PINCH_ZOOM_DEFAULT);
  const [readoutVisible, setReadoutVisible] = useState(false);
  const readoutPrimedRef = useRef(false);

  useEffect(() => {
    const scrollRoot = scrollRootRef.current;
    if (!scrollRoot || !active) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      event.preventDefault();
      setZoom((current) => pinchZoomAfterWheel(current, event.deltaY));
    };

    scrollRoot.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      scrollRoot.removeEventListener('wheel', handleWheel);
    };
  }, [active, scrollRootRef]);

  useEffect(() => {
    // Skip the mount pass so the readout only ever answers a gesture.
    if (!readoutPrimedRef.current) {
      readoutPrimedRef.current = true;
      return;
    }
    setReadoutVisible(true);
    const timer = setTimeout(() => {
      setReadoutVisible(false);
    }, ZOOM_READOUT_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [zoom]);

  const reset = useCallback(() => {
    readoutPrimedRef.current = false;
    setReadoutVisible(false);
    setZoom(PINCH_ZOOM_DEFAULT);
  }, []);

  return { zoom, readoutVisible, reset };
}
