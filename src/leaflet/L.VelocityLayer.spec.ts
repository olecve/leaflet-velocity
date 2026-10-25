import { describe, expect, it, vi } from 'vitest';
import L from 'leaflet';

import VelocityLayer from './L.VelocityLayer';

// Guards createPane()'s side effect after removing the dead `pane` variable that used to hold its result.
describe('VelocityLayer.onAdd pane creation', () => {
  function stubCanvasLayer() {
    (L as unknown as { canvasLayer: () => unknown }).canvasLayer = () => ({
      delegate: () => ({ addTo: () => {}, getCanvas: () => ({}) }),
    });
  }

  it('creates the pane when it does not already exist', () => {
    stubCanvasLayer();
    const createPane = vi.fn();
    const fakeMap = {
      getPane: vi.fn(() => undefined),
      createPane,
    } as unknown as L.Map;

    new VelocityLayer().onAdd(fakeMap);

    expect(createPane).toHaveBeenCalledWith('overlayPane');
  });

  it('does not recreate the pane when it already exists', () => {
    stubCanvasLayer();
    const createPane = vi.fn();
    const fakeMap = {
      getPane: vi.fn(() => document.createElement('div')),
      createPane,
    } as unknown as L.Map;

    new VelocityLayer().onAdd(fakeMap);

    expect(createPane).not.toHaveBeenCalled();
  });
});

// Regression test for a hardcoded clearRect(0, 0, 3000, 3000) that left stale particle trails on
// any canvas larger than 3000px (large/ultrawide/4K displays).
describe('VelocityLayer canvas clearing', () => {
  // A real canvas + real 2d context (via vitest-canvas-mock), not a hand-rolled fake, so this
  // exercises clearRect the same way the browser's real Canvas API would.
  function realContext(width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d')!;
    vi.spyOn(context, 'clearRect');
    return context;
  }

  it('clearAndRestart() clears the full actual canvas size, not a hardcoded 3000x3000', () => {
    const layer = new VelocityLayer();
    const context = realContext(4000, 3500);
    (layer as unknown as { _context: CanvasRenderingContext2D })._context = context;

    (layer as unknown as { clearAndRestart: () => void }).clearAndRestart();

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 4000, 3500);
  });

  it('clearWind() clears the full actual canvas size, not a hardcoded 3000x3000', () => {
    const layer = new VelocityLayer();
    const context = realContext(4000, 3500);
    (layer as unknown as { _context: CanvasRenderingContext2D })._context = context;

    (layer as unknown as { clearWind: () => void }).clearWind();

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 4000, 3500);
  });

  it('destroyWind() clears the full actual canvas size, not a hardcoded 3000x3000', () => {
    const layer = new VelocityLayer();
    const context = realContext(4000, 3500);
    (layer as unknown as { _context: CanvasRenderingContext2D })._context = context;
    (layer as unknown as { _map: L.Map })._map = {
      removeLayer: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as L.Map;

    (layer as unknown as { destroyWind: () => void }).destroyWind();

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 4000, 3500);
  });
});

// Regression coverage for the blank-then-restart flash that setData()'s clearAndRestart() causes.
describe('VelocityLayer.updateData', () => {
  function stubbedWindy() {
    return {
      setData: vi.fn(),
      setOptions: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  it('pushes new data into the running simulation without touching the canvas or restarting it', () => {
    const layer = new VelocityLayer();
    layer.fire = vi.fn();
    const windy = stubbedWindy();
    const context = { clearRect: vi.fn() } as unknown as CanvasRenderingContext2D;
    (layer as unknown as { _windy: unknown })._windy = windy;
    (layer as unknown as { _context: CanvasRenderingContext2D })._context = context;

    const data = [{ header: { parameterCategory: 1, parameterNumber: 2 }, data: [1, 2] }] as never;
    layer.updateData(data);

    expect(windy.setData).toHaveBeenCalledWith(data);
    expect(windy.start).not.toHaveBeenCalled();
    expect(context.clearRect).not.toHaveBeenCalled();
  });

  it('forwards non-data options to the windy instance without restarting it', () => {
    const layer = new VelocityLayer();
    layer.fire = vi.fn();
    const windy = stubbedWindy();
    (layer as unknown as { _windy: unknown })._windy = windy;

    layer.updateData([], { minVelocity: 0, maxVelocity: 5 });

    expect(windy.setOptions).toHaveBeenCalledWith({ minVelocity: 0, maxVelocity: 5 });
    expect(windy.start).not.toHaveBeenCalled();
  });

  it('does nothing to windy when the layer has not been added to a map yet', () => {
    const layer = new VelocityLayer();
    layer.fire = vi.fn();

    expect(() => layer.updateData([])).not.toThrow();
  });
});
