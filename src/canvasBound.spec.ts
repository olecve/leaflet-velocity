import { describe, expect, it, vi } from 'vitest';

import CanvasBound from './canvasBound';
import Particule from './particle';

describe('CanvasBound', () => {
  it('computes width and height from the min/max corners', () => {
    const bound = new CanvasBound(10, 20, 110, 220);

    expect(bound.width).toBe(100);
    expect(bound.height).toBe(200);
  });

  it('getRandomParticule() places a new particle within the bounds', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const bound = new CanvasBound(10, 20, 110, 220);
    const p = bound.getRandomParticule(64);

    expect(p.x).toBe(60);
    expect(p.y).toBe(120);
    expect(p.maxAge).toBe(64);

    vi.restoreAllMocks();
  });

  it('resetParticule() moves an existing particle within the bounds and returns it', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const bound = new CanvasBound(10, 20, 110, 220);
    const p = new Particule(0, 0, 64);

    const result = bound.resetParticule(p);

    expect(result).toBe(p);
    expect(p.x).toBe(60);
    expect(p.y).toBe(120);
    expect(p.age).toBe(0);

    vi.restoreAllMocks();
  });
});
