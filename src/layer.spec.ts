import { describe, expect, it } from 'vitest';

import CanvasBound from './canvasBound';
import Layer from './layer';
import MapBound from './mapBound';

function makeLayer() {
  const mapBound = new MapBound(null as never, 10, 10, 0, 0);
  const canvasBound = new CanvasBound(0, 0, 500, 500);
  return new Layer(mapBound, canvasBound);
}

describe('layer', () => {
  it('mapToCanvas then canvasToMap round-trips back to close to the original point', () => {
    const layer = makeLayer();

    const [x, y] = layer.mapToCanvas(5, 5);
    const [lng, lat] = layer.canvasToMap(x, y);

    expect(lng).toBeCloseTo(5, 1);
    expect(lat).toBeCloseTo(5, 1);
  });

  it('maps the west edge of the bound to canvas x = 0', () => {
    const layer = makeLayer();

    const [x] = layer.mapToCanvas(0, 5);

    expect(x).toBeCloseTo(0, 1);
  });

  it('maps the east edge of the bound to canvas x = canvas width', () => {
    const layer = makeLayer();

    const [x] = layer.mapToCanvas(10, 5);

    expect(x).toBeCloseTo(500, 1);
  });
});
