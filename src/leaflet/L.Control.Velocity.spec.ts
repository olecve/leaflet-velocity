import { describe, expect, it } from 'vitest';

import ControlVelocity from './L.Control.Velocity';

describe('ControlVelocity.vectorToDegrees', () => {
  // Pins down vectorToDegrees's CCW vMs handling with real numbers.
  it('negates a positive vMs under a CCW convention', () => {
    const control = new ControlVelocity();

    expect(control.vectorToDegrees(1, 1, 'bearingCCW')).toBeCloseTo(315);
  });

  it('takes the absolute value of a negative vMs under a CCW convention', () => {
    const control = new ControlVelocity();

    expect(control.vectorToDegrees(1, -1, 'bearingCCW')).toBeCloseTo(225);
  });

  it('treats a zero vMs as non-positive (abs, not negated) under a CCW convention', () => {
    const control = new ControlVelocity();

    expect(control.vectorToDegrees(1, 0, 'bearingCCW')).toBeCloseTo(270);
  });

  it('leaves vMs untouched for non-CCW conventions', () => {
    const control = new ControlVelocity();

    expect(control.vectorToDegrees(1, 1, 'bearingCW')).toBeCloseTo(45);
  });
});

describe('ControlVelocity.vectorToSpeed', () => {
  it('returns the raw magnitude in m/s for an unrecognized unit', () => {
    const control = new ControlVelocity();

    expect(control.vectorToSpeed(3, 4, 'm/s')).toBeCloseTo(5);
  });

  it('converts to km/h', () => {
    const control = new ControlVelocity();

    expect(control.vectorToSpeed(3, 4, 'k/h')).toBeCloseTo(18);
  });

  it('converts to knots', () => {
    const control = new ControlVelocity();

    expect(control.vectorToSpeed(3, 4, 'kt')).toBeCloseTo(9.7276, 3);
  });

  it('converts to mph', () => {
    const control = new ControlVelocity();

    expect(control.vectorToSpeed(3, 4, 'mph')).toBeCloseTo(11.1847, 3);
  });

  it('is 0 for a zero vector regardless of unit', () => {
    const control = new ControlVelocity();

    expect(control.vectorToSpeed(0, 0, 'kt')).toBe(0);
  });
});

describe('ControlVelocity.degreesToCardinalDirection', () => {
  it('maps 0 degrees to N', () => {
    const control = new ControlVelocity();

    expect(control.degreesToCardinalDirection(0)).toBe('N');
  });

  it('maps a value just under the 348.75 wraparound back to N', () => {
    const control = new ControlVelocity();

    expect(control.degreesToCardinalDirection(359)).toBe('N');
  });

  it('maps 180 degrees to S', () => {
    const control = new ControlVelocity();

    expect(control.degreesToCardinalDirection(180)).toBe('S');
  });

  it('returns an empty string for out-of-range input (e.g. negative degrees)', () => {
    const control = new ControlVelocity();

    expect(control.degreesToCardinalDirection(-10)).toBe('');
  });
});
