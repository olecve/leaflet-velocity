import { describe, expect, it, vi } from 'vitest';

import CanvasBound from './canvasBound';
import Layer from './layer';
import MapBound from './mapBound';
import Windy from './windy';

function createWindy() {
  return new Windy({
    canvas: document.createElement('canvas'),
  } as any);
}

// Same construction as layer.spec.ts's makeLayer — just enough for start() to seed particles.
function makeLayer() {
  const mapBound = new MapBound(null as never, 10, 10, 0, 0);
  const canvasBound = new CanvasBound(0, 0, 500, 500);
  return new Layer(mapBound, canvasBound);
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

  it('stop() cancels the animation frame scheduled by start(), not some other timer', () => {
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(123);
    const cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

    const windy = createWindy();
    windy.setData(uAndVComponents());
    windy.start(makeLayer());
    windy.stop();

    expect(cafSpy).toHaveBeenCalledWith(123);

    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });

  it('start() cancels a previous run instead of leaving two animation-frame chains scheduled', () => {
    // Mirrors VelocityLayer.clearAndRestart(), which calls start() again on every data/zoom/drag
    // refresh without calling stop() first.
    let nextId = 1;
    const scheduled: number[] = [];
    const cancelled: number[] = [];
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => {
      const id = nextId++;
      scheduled.push(id);
      return id;
    });
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id: number) => {
      cancelled.push(id);
    });

    const windy = createWindy();
    windy.setData(uAndVComponents());
    windy.start(makeLayer());
    windy.start(makeLayer());

    expect(scheduled).toEqual([1, 2]);
    expect(cancelled).toEqual([1]);

    vi.restoreAllMocks();
  });
});
