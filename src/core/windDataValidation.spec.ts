import { describe, expect, it } from 'vitest';

import { validateWindData, WindDataForValidation } from './windDataValidation';

function record(overrides: Partial<WindDataForValidation['header']> = {}, dataLength = 4): WindDataForValidation {
  return {
    header: { nx: 2, ny: 2, dx: 10, dy: 10, ...overrides },
    data: new Array(dataLength).fill(0),
  };
}

describe('validateWindData', () => {
  it('returns null for well-formed matching u/v records', () => {
    expect(validateWindData(record(), record())).toBeNull();
  });

  it('flags a u-component data length that does not match nx*ny', () => {
    const error = validateWindData(record({}, 3), record());

    expect(error).toBe('Wind data length does not match nx*ny (expected 4)');
  });

  it('flags a v-component data length that does not match nx*ny', () => {
    const error = validateWindData(record(), record({}, 3));

    expect(error).toBe('Wind data length does not match nx*ny (expected 4)');
  });

  it('flags a zero dx', () => {
    const error = validateWindData(record({ dx: 0 }), record());

    expect(error).toBe('Wind data dx/dy must be nonzero');
  });

  it('flags a zero dy', () => {
    const error = validateWindData(record({ dy: 0 }), record());

    expect(error).toBe('Wind data dx/dy must be nonzero');
  });
});
