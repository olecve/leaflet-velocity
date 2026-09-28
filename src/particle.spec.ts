import { describe, expect, it, vi } from 'vitest';

import Particule from './particle';

describe('Particule', () => {
  it('starts at a random age between 0 and maxAge', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const p = new Particule(1, 2, 10);

    expect(p.x).toBe(1);
    expect(p.y).toBe(2);
    expect(p.maxAge).toBe(10);
    expect(p.age).toBe(5);

    vi.restoreAllMocks();
  });

  it('reset() moves the particle and sets age back to 0', () => {
    const p = new Particule(1, 2, 10);

    p.grow();
    p.grow();
    p.reset(9, 9);

    expect(p.x).toBe(9);
    expect(p.y).toBe(9);
    expect(p.age).toBe(0);
  });

  it('is not dead at exactly maxAge, but is dead just past it', () => {
    const p = new Particule(0, 0, 2);
    p.reset(0, 0);

    p.age = 2;
    expect(p.isDead).toBe(false);

    p.age = 3;
    expect(p.isDead).toBe(true);
  });

  it('grow() increments age by 1', () => {
    const p = new Particule(0, 0, 10);
    p.reset(0, 0);

    p.grow();

    expect(p.age).toBe(1);
  });
});
