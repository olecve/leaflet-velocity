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
