// N wraps around the 0/360 seam, so it's handled separately below rather than in this table.
const BOUNDARIES: { min: number; name: string }[] = [
  { min: 11.25, name: 'NNW' },
  { min: 33.75, name: 'NW' },
  { min: 56.25, name: 'WNW' },
  { min: 78.75, name: 'W' },
  { min: 101.25, name: 'WSW' },
  { min: 123.75, name: 'SW' },
  { min: 146.25, name: 'SSW' },
  { min: 168.75, name: 'S' },
  { min: 191.25, name: 'SSE' },
  { min: 213.75, name: 'SE' },
  { min: 236.25, name: 'ESE' },
  { min: 258.75, name: 'E' },
  { min: 281.25, name: 'ENE' },
  { min: 303.75, name: 'NE' },
  { min: 326.25, name: 'NNE' },
];

export function degreesToCardinalDirection(deg: number): string {
  if (deg < 0) return '';
  if (deg >= 348.75 || deg < 11.25) return 'N';

  let direction = '';
  for (const boundary of BOUNDARIES) {
    if (deg < boundary.min) break;
    direction = boundary.name;
  }
  return direction;
}
