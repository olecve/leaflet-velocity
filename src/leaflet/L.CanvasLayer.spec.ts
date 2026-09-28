import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import L from 'leaflet';

import CanvasLayer from './L.CanvasLayer';

function fakeMap(overrides: Record<string, unknown> = {}) {
  const overlayPane = document.createElement('div');
  return {
    getSize: () => ({ x: 100, y: 200 }),
    getPanes: () => ({ overlayPane }),
    options: { zoomAnimation: false },
    on: vi.fn(),
    off: vi.fn(),
    ...overrides,
  } as unknown as L.Map;
}

describe('CanvasLayer.initialize', () => {
  it('resets internal state and forwards options via L.Util.setOptions', () => {
    const layer = new CanvasLayer();

    layer.initialize({ opacity: 0.5 });

    expect(layer.getCanvas()).toBeNull();
    expect((layer as unknown as { options: { opacity: number } }).options.opacity).toBe(0.5);
  });
});

describe('CanvasLayer.delegate', () => {
  it('stores the delegate and returns itself for chaining', () => {
    const layer = new CanvasLayer();
    const del = {};

    expect(layer.delegate(del)).toBe(layer);
  });
});

describe('CanvasLayer.needRedraw', () => {
  const originalRequestAnimFrame = L.Util.requestAnimFrame;

  afterEach(() => {
    L.Util.requestAnimFrame = originalRequestAnimFrame;
  });

  it('schedules a redraw only once until the scheduled frame runs', () => {
    const requestAnimFrame = vi.fn(() => 1);
    L.Util.requestAnimFrame = requestAnimFrame as unknown as typeof L.Util.requestAnimFrame;
    const layer = new CanvasLayer();

    layer.needRedraw();
    layer.needRedraw();

    expect(requestAnimFrame).toHaveBeenCalledTimes(1);
  });
});

describe('CanvasLayer.getEvents', () => {
  const originalAny3d = L.Browser.any3d;

  afterEach(() => {
    (L.Browser as unknown as { any3d: boolean }).any3d = originalAny3d;
  });

  it('includes a zoomanim handler when zoom animation is supported', () => {
    (L.Browser as unknown as { any3d: boolean }).any3d = true;
    const layer = new CanvasLayer();
    (layer as unknown as { _map: L.Map })._map = fakeMap({ options: { zoomAnimation: true } });

    expect(typeof layer.getEvents().zoomanim).toBe('function');
  });

  it('leaves zoomanim undefined when zoom animation is unsupported', () => {
    (L.Browser as unknown as { any3d: boolean }).any3d = false;
    const layer = new CanvasLayer();
    (layer as unknown as { _map: L.Map })._map = fakeMap({ options: { zoomAnimation: true } });

    expect(layer.getEvents().zoomanim).toBeUndefined();
  });
});

describe('CanvasLayer.addTo', () => {
  it('adds itself to the map via map.addLayer', () => {
    const layer = new CanvasLayer();
    const addLayer = vi.fn();
    const map = { addLayer } as unknown as L.Map;

    expect(layer.addTo(map)).toBe(layer);
    expect(addLayer).toHaveBeenCalledWith(layer);
  });
});

describe('CanvasLayer.drawLayer', () => {
  function fakeDrawMap() {
    return {
      getSize: () => ({ x: 100, y: 200 }),
      getBounds: () => 'bounds',
      getZoom: () => 5,
      getCenter: () => 'center',
      containerPointToLatLng: () => 'corner-latlng',
      options: { crs: { project: (v: unknown) => `projected-${v}` } },
    } as unknown as L.Map;
  }

  it('passes computed view info to the delegate onDrawLayer callback and clears the pending frame', () => {
    const layer = new CanvasLayer();
    const onDrawLayer = vi.fn();
    layer.delegate({ onDrawLayer });
    (layer as unknown as { _map: L.Map })._map = fakeDrawMap();
    (layer as unknown as { _frame: number })._frame = 1;

    layer.drawLayer();

    expect(onDrawLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        layer,
        bounds: 'bounds',
        size: { x: 100, y: 200 },
        zoom: 5,
        center: 'projected-center',
        corner: 'projected-corner-latlng',
      }),
    );
    expect((layer as unknown as { _frame: number | null })._frame).toBeNull();
  });

  it('does nothing when no delegate implements onDrawLayer', () => {
    const layer = new CanvasLayer();
    (layer as unknown as { _map: L.Map })._map = fakeDrawMap();

    expect(() => layer.drawLayer()).not.toThrow();
  });
});

describe('CanvasLayer.onAdd / onRemove', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // needRedraw's scheduled drawLayer would otherwise run against a fake map missing getBounds/getZoom/crs.
    vi.spyOn(L.Util, 'requestAnimFrame').mockReturnValue(1);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('creates and appends the canvas, sizes it, and registers map events', () => {
    const layer = new CanvasLayer();
    const map = fakeMap();

    layer.onAdd(map);

    const overlayPane = map.getPanes().overlayPane;
    expect(overlayPane.contains(layer.getCanvas())).toBe(true);
    expect(layer.getCanvas().width).toBe(100);
    expect(layer.getCanvas().height).toBe(200);
    expect(map.on).toHaveBeenCalledWith(expect.objectContaining({ resize: expect.any(Function) }), layer);
  });

  it('calls the delegate onLayerDidMount hook when present', () => {
    const layer = new CanvasLayer();
    const onLayerDidMount = vi.fn();
    layer.delegate({ onLayerDidMount });

    layer.onAdd(fakeMap());

    expect(onLayerDidMount).toHaveBeenCalled();
  });

  it('removes the canvas, unregisters map events, and calls onLayerWillUnmount', () => {
    const layer = new CanvasLayer();
    const onLayerWillUnmount = vi.fn();
    layer.delegate({ onLayerWillUnmount });
    const map = fakeMap();

    layer.onAdd(map);
    const canvas = layer.getCanvas();
    layer.onRemove(map);

    expect(map.getPanes().overlayPane.contains(canvas)).toBe(false);
    expect(map.off).toHaveBeenCalled();
    expect(onLayerWillUnmount).toHaveBeenCalled();
    expect(layer.getCanvas()).toBeNull();
  });
});
