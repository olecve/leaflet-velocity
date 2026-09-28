import { describe, expect, it } from 'vitest';

import ColorScale from './colorScale';

describe('ColorScale', () => {
  it('clamps values at or below the minimum to the first color', () => {
    const scale = new ColorScale(0, 10, ['a', 'b', 'c']);

    expect(scale.getColorIndex(0)).toBe(0);
    expect(scale.getColorIndex(-5)).toBe(0);
    expect(scale.getColor(-5)).toBe('a');
  });

  it('clamps values at or above the maximum to the last color', () => {
    const scale = new ColorScale(0, 10, ['a', 'b', 'c']);

    expect(scale.getColorIndex(10)).toBe(2);
    expect(scale.getColorIndex(100)).toBe(2);
    expect(scale.getColor(100)).toBe('c');
  });

  it('buckets values in between proportionally across the scale', () => {
    const scale = new ColorScale(0, 9, ['a', 'b', 'c']);

    // 3-color scale over [0, 9): thirds are [0,3) -> 'a', [3,6) -> 'b', [6,9) -> 'c'
    expect(scale.getColor(1)).toBe('a');
    expect(scale.getColor(4)).toBe('b');
    expect(scale.getColor(7)).toBe('c');
  });

  it('falls back to the default 15-color scale when none is provided', () => {
    const scale = new ColorScale(0, 10);

    expect(scale.size).toBe(15);
  });

  it('ignores an empty custom scale and keeps the default', () => {
    const scale = new ColorScale(0, 10, []);

    expect(scale.size).toBe(15);
  });

  it('setMinMax updates the range used for subsequent lookups', () => {
    const scale = new ColorScale(0, 10, ['a', 'b']);
    scale.setMinMax(0, 100);

    expect(scale.getColorIndex(10)).toBe(0);
  });
});
