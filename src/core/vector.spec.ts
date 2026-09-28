import { describe, expect, it } from 'vitest';

import Vector from './vector';

describe('Vector', () => {
  it('defaults u and v to 0 when omitted', () => {
    const v = new Vector();

    expect(v.u).toBe(0);
    expect(v.v).toBe(0);
  });

  it('stores the given u and v', () => {
    const v = new Vector(3, 4);

    expect(v.u).toBe(3);
    expect(v.v).toBe(4);
  });

  it('computes intensity as the vector magnitude', () => {
    const v = new Vector(3, 4);

    expect(v.intensity).toBe(5);
  });
});
