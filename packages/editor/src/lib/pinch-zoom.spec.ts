import { describe, expect, it } from 'vitest';

import {
  clampPinchZoom,
  formatPinchZoom,
  pinchZoomAfterWheel,
  PINCH_ZOOM_MAX,
  PINCH_ZOOM_MIN,
} from './pinch-zoom';

describe('clampPinchZoom', () => {
  it('holds the zoom inside the usable range', () => {
    // Arrange
    const values = [-3, 0, 12, Number.NaN];

    // Act
    const clamped = values.map(clampPinchZoom);

    // Assert
    expect(clamped).toEqual([
      PINCH_ZOOM_MIN,
      PINCH_ZOOM_MIN,
      PINCH_ZOOM_MAX,
      1,
    ]);
  });
});

describe('pinchZoomAfterWheel', () => {
  it('zooms in when the pinch opens and out when it closes', () => {
    // Arrange
    const zoom = 1;

    // Act
    const zoomedIn = pinchZoomAfterWheel(zoom, -120);
    const zoomedOut = pinchZoomAfterWheel(zoom, 120);

    // Assert
    expect(zoomedIn).toBeGreaterThan(zoom);
    expect(zoomedOut).toBeLessThan(zoom);
  });

  it('changes by a constant ratio so a pinch feels linear at any zoom', () => {
    // Arrange — both ends well inside the clamp, so only the ratio is measured
    const nearMin = pinchZoomAfterWheel(0.6, -12) / 0.6;

    // Act
    const nearDouble = pinchZoomAfterWheel(1.2, -12) / 1.2;

    // Assert
    expect(nearDouble).toBeCloseTo(nearMin, 10);
  });

  it('never leaves the usable range', () => {
    // Arrange
    const deltas = [-10_000, 10_000];

    // Act
    const results = deltas.map((delta) => pinchZoomAfterWheel(1, delta));

    // Assert
    expect(results).toEqual([PINCH_ZOOM_MAX, PINCH_ZOOM_MIN]);
  });
});

describe('formatPinchZoom', () => {
  it('reads out whole percentages', () => {
    // Arrange
    const zoom = 1.504;

    // Act
    const label = formatPinchZoom(zoom);

    // Assert
    expect(label).toBe('150%');
  });
});
