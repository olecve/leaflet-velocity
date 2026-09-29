import { describe, expect, it } from 'vitest';

import Grid from './grid';
import Vector from './vector';

// A 2x2 grid, row-major [north-west, north-east, south-west, south-east], φ0=10, λ0=0, spacing 10° both ways.
function make2x2Grid() {
  const data = [new Vector(1, 0), new Vector(2, 0), new Vector(0, 1), new Vector(0, 2)];
  return new Grid(data, 10, 0, 10, 10, 2, 2);
}

describe('Grid', () => {
  it('returns the exact vector at a grid point', () => {
    const grid = make2x2Grid();

    const v = grid.get(0, 10);

    expect(v.u).toBe(1);
    expect(v.v).toBe(0);
  });

  it('bilinearly interpolates between grid points', () => {
    const grid = make2x2Grid();

    // Halfway between the two points on the north row (both v=0): u should be the midpoint, 1.5.
    const v = grid.get(5, 10);

    expect(v.u).toBeCloseTo(1.5);
    expect(v.v).toBeCloseTo(0);
  });

  it('returns a zero vector outside the grid bounds', () => {
    const grid = make2x2Grid();

    const v = grid.get(1000, 1000);

    expect(v.u).toBe(0);
    expect(v.v).toBe(0);
  });

  it('valueRange reports the min/max intensity across all data points', () => {
    const grid = make2x2Grid();

    expect(grid.valueRange).toEqual([1, 2]);
  });

  it('valueRange is [0, 0] for an empty grid', () => {
    const grid = new Grid([], 10, 0, 10, 10, 0, 0);

    expect(grid.valueRange).toEqual([0, 0]);
  });

  // λ0 = 100 (not 0): a coincidental λ0 === 0 would mask a wraparound bug here. A single row
  // (height 1) collapses the latitude interpolation so these tests isolate the longitude wraparound.
  describe('longitude wraparound at a non-zero λ0', () => {
    it('wraps to the first column for a grid spanning the full 360°', () => {
      // 4 columns * 90° = 360°, so this grid is continuous (global) and should wrap.
      const data = [new Vector(1, 0), new Vector(2, 0), new Vector(3, 0), new Vector(4, 0)];
      const grid = new Grid(data, 0, 100, 90, 90, 1, 4);

      // Halfway between the last column (λ=370≡10, u=4) and the wrapped first column (λ0=100, u=1).
      const v = grid.get(55, 0);

      expect(v.u).toBeCloseTo(2.5);
    });

    it('clamps at the last column for a regional grid that does not span 360°', () => {
      // 4 columns * 10° = 40°, well short of 360°, so this grid must not wrap.
      const data = [new Vector(1, 0), new Vector(2, 0), new Vector(3, 0), new Vector(4, 0)];
      const grid = new Grid(data, 0, 100, 90, 10, 1, 4);

      // Past the last column (λ=130): should hold at the last column's value, not wrap around.
      const v = grid.get(135, 0);

      expect(v.u).toBeCloseTo(4);
    });

    it('wraps the same way for a negative longitude that maps to the same point', () => {
      // Same continuous grid and query point as the wrap test above (λ=55), just expressed as a
      // negative longitude (55 - 360) to prove floorMod's own wraparound handles negative input.
      const data = [new Vector(1, 0), new Vector(2, 0), new Vector(3, 0), new Vector(4, 0)];
      const grid = new Grid(data, 0, 100, 90, 90, 1, 4);

      const v = grid.get(-305, 0);

      expect(v.u).toBeCloseTo(2.5);
    });

    it('returns the exact last-column value right at the wrap boundary, with no interpolation', () => {
      // λ = 370 lands exactly on the last column (λ0=100 + 3*90=270 => 370, i.e. vλ=0 exactly), so
      // this should return that column's value outright rather than blending toward the wrapped one.
      const data = [new Vector(1, 0), new Vector(2, 0), new Vector(3, 0), new Vector(4, 0)];
      const grid = new Grid(data, 0, 100, 90, 90, 1, 4);

      const v = grid.get(370, 0);

      expect(v.u).toBeCloseTo(4);
    });

    it('returns the single column unchanged for a degenerate 1-column continuous grid', () => {
      // width=1, Δλ=360 => isContinuous (1*360 >= 360). iλ and the wrapped jλ both resolve to the
      // same (only) column, so any query longitude should return that column's value untouched.
      const data = [new Vector(7, 3)];
      const grid = new Grid(data, 0, 50, 90, 360, 1, 1);

      const v = grid.get(200, 0);

      expect(v.u).toBeCloseTo(7);
      expect(v.v).toBeCloseTo(3);
    });
  });
});
