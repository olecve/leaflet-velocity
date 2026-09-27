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
