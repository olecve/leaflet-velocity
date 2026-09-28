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
});
