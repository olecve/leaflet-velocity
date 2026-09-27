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
});
