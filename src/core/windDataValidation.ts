import { WindDataHeader } from '../types.js';

export interface WindDataForValidation {
  header: Pick<WindDataHeader, 'nx' | 'ny' | 'dx' | 'dy'>;
  data: number[];
}

/**
 * Checks that a loaded u/v wind data pair is well-formed enough to build a Grid from.
 * @returns an error message if invalid, or null if the data is usable.
 */
export function validateWindData(uData: WindDataForValidation, vData: WindDataForValidation): string | null {
  const { nx, ny, dx, dy } = uData.header;
  const expectedLength = nx * ny;
  if (uData.data.length !== expectedLength || vData.data.length !== expectedLength) {
    return `Wind data length does not match nx*ny (expected ${expectedLength})`;
  }
  if (!dx || !dy) {
    return 'Wind data dx/dy must be nonzero';
  }
  return null;
}
