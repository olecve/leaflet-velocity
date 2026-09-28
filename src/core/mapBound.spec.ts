import { describe, expect, it } from 'vitest';

import MapBound from './mapBound';

const toRad = (deg: number) => (deg * Math.PI) / 180;

describe('MapBound', () => {
  it('computes height as the radian difference between north and south', () => {
    const bound = new MapBound(null as never, 10, 20, 5, 15);

    expect(bound.height).toBeCloseTo(toRad(10) - toRad(5));
  });

  it('computes width as the radian difference between east and west', () => {
    const bound = new MapBound(null as never, 10, 20, 5, 15);

    expect(bound.width).toBeCloseTo(toRad(20) - toRad(15));
  });

  // A view spanning the antimeridian (e.g. panned across the Pacific) can have east < west numerically.
  it('stays a small negative span when east is numerically less than west', () => {
    const bound = new MapBound(null as never, 10, -170, 5, 170);

    expect(bound.width).toBeCloseTo(toRad(-170) - toRad(170));
  });
});
