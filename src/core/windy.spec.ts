import { describe, expect, it, vi } from 'vitest';

import Windy from './windy';

function createWindy() {
  return new Windy({
    canvas: document.createElement('canvas'),
  } as any);
}

function uComponentOnly(): any {
  return [
    {
      header: { parameterCategory: 2, parameterNumber: 2, la1: 10, lo1: 0, dy: 10, dx: 10, ny: 2, nx: 2 },
      data: [1, 2, 3, 4],
    },
  ];
}

// Same 2x2 grid as grid.spec.ts's make2x2Grid, split into separate u/v records the way real GRIB data arrives.
function uAndVComponents(): any {
  const header = { la1: 10, lo1: 0, dy: 10, dx: 10, ny: 2, nx: 2 };
  return [
    { header: { ...header, parameterCategory: 2, parameterNumber: 2 }, data: [1, 2, 0, 0] },
    { header: { ...header, parameterCategory: 2, parameterNumber: 3 }, data: [0, 0, 1, 2] },
  ];
}

describe('Windy', () => {
  it('stop() does not throw when called before start() has ever run', () => {
    // animationBucket is only created in start(); a layer removed right after being added used to throw here.
    const windy = createWindy();

    expect(() => windy.stop()).not.toThrow();
  });

  it('evolve() does not throw when called before start() has ever run', () => {
    const windy = createWindy();

    expect(() => (windy as unknown as { evolve: () => void }).evolve()).not.toThrow();
  });

  it('interpolate() returns null before any data has been set', () => {
    const windy = createWindy();

    expect(windy.interpolate(0, 0)).toBeNull();
  });

  it('setData() warns and leaves the grid unset when the v-component is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const windy = createWindy();

    windy.setData(uComponentOnly());

    expect(warn).toHaveBeenCalledWith('Data are not correct format');
    expect(windy.interpolate(0, 0)).toBeNull();

    warn.mockRestore();
  });

  it('setData() warns and leaves the grid unset when data length does not match nx*ny', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const windy = createWindy();
    const header = { la1: 10, lo1: 0, dy: 10, dx: 10, ny: 2, nx: 2 };

    windy.setData([
      { header: { ...header, parameterCategory: 2, parameterNumber: 2 }, data: [1, 2, 0] }, // 3, not nx*ny=4
      { header: { ...header, parameterCategory: 2, parameterNumber: 3 }, data: [0, 0, 1, 2] },
    ] as any);

    expect(warn).toHaveBeenCalledWith('Wind data length does not match nx*ny (expected 4)');
    expect(windy.interpolate(0, 0)).toBeNull();

    warn.mockRestore();
  });

  it('interpolate() delegates to the same Grid used for particle animation', () => {
    const windy = createWindy();
    windy.setData(uAndVComponents());

    // Halfway between the two points on the north row (both v=0): u should be the midpoint, 1.5.
    const [u, v, speed] = windy.interpolate(5, 10)!;

    expect(u).toBeCloseTo(1.5);
    expect(v).toBeCloseTo(0);
    expect(speed).toBeCloseTo(1.5);
  });

  it('interpolate() returns a zero vector, not null, for a point outside the loaded grid', () => {
    // interpolate() only returns null when the grid itself was never set (see the test above).
    const windy = createWindy();
    windy.setData(uAndVComponents());

    expect(windy.interpolate(1000, 1000)).toEqual([0, 0, 0]);
  });
});
