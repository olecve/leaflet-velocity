import { describe, expect, it } from 'vitest';
import L from 'leaflet';

// Must run against the built dist/ output, not raw src/*.ts — see the tsconfig.json target comment for why.
describe('the .extend() mixin against the built dist/ output', () => {
  it('L.velocityLayer() produces a layer with real onAdd/onRemove methods', async () => {
    await import('../dist/index.js');

    const layer = L.velocityLayer({ displayValues: false, displayOptions: {} as never, data: [] });

    expect(typeof layer.onAdd).toBe('function');
    expect(typeof layer.onRemove).toBe('function');
  });

  it('L.canvasLayer() produces a layer with a real onAdd method', async () => {
    await import('../dist/index.js');

    const layer = L.canvasLayer();

    expect(typeof layer.onAdd).toBe('function');
  });

  it('L.control.velocity() produces a control with a real onAdd method', async () => {
    await import('../dist/index.js');

    const control = L.control.velocity();

    expect(typeof control.onAdd).toBe('function');
  });
});
