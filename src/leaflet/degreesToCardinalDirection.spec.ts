import { describe, expect, it } from 'vitest';

import { degreesToCardinalDirection } from './degreesToCardinalDirection';

// All 16 compass labels, at their exact center angle.
const CENTERS: [number, string][] = [
  [0, 'N'],
  [22.5, 'NNW'],
  [45, 'NW'],
  [67.5, 'WNW'],
  [90, 'W'],
  [112.5, 'WSW'],
  [135, 'SW'],
  [157.5, 'SSW'],
  [180, 'S'],
  [202.5, 'SSE'],
  [225, 'SE'],
  [247.5, 'ESE'],
  [270, 'E'],
  [292.5, 'ENE'],
  [315, 'NE'],
  [337.5, 'NNE'],
];

describe('degreesToCardinalDirection', () => {
  it.each(CENTERS)('maps %s° to %s', (deg, name) => {
    expect(degreesToCardinalDirection(deg)).toBe(name);
  });

  it('maps a value past the 348.75 wraparound back to N', () => {
    expect(degreesToCardinalDirection(359)).toBe('N');
  });

  it('returns an empty string for negative degrees', () => {
    expect(degreesToCardinalDirection(-10)).toBe('');
  });

  it('maps the WNW/W boundary at 78.75 degrees to W, not WNW', () => {
    expect(degreesToCardinalDirection(78.75)).toBe('W');
    expect(degreesToCardinalDirection(78.5)).toBe('WNW');
  });

  it('spaces every non-wraparound direction exactly 22.5° apart', () => {
    const names = ['NNW', 'NW', 'WNW', 'W', 'WSW', 'SW', 'SSW', 'S', 'SSE', 'SE', 'ESE', 'E', 'ENE', 'NE', 'NNE'];

    names.forEach((name, i) => {
      const start = 11.25 + i * 22.5;
      expect(degreesToCardinalDirection(start)).toBe(name);
      expect(degreesToCardinalDirection(start + 22.49)).toBe(name);
    });
  });
});
