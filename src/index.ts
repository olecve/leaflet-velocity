import L from 'leaflet';

import CanvasBound from './canvasBound';
import MapBound from './mapBound';
import Windy from './windy';
import CanvasLayer from './L.CanvasLayer';
import VelocityLayer from './L.VelocityLayer';
import ControlVelocity from './L.Control.Velocity';
import { Position, SpeedUnit, VelocityDisplayOptions, VelocityOptions } from './types';

export { CanvasBound, MapBound, Windy };
export type { Position, SpeedUnit, VelocityDisplayOptions, VelocityOptions };

// Extends the imported L, not window.L — see README. The .extend() mixin pattern is inherently untypeable, hence the casts.
const extendableL = L as unknown as Record<string, unknown>;

extendableL.CanvasLayer = (L.Layer ? L.Layer : L.Class).extend(new CanvasLayer());
extendableL.canvasLayer = function () {
  return new (L as unknown as { CanvasLayer: new () => CanvasLayer }).CanvasLayer();
};

(L.Control as unknown as Record<string, unknown>).Velocity = L.Control.extend(new ControlVelocity());
(L.control as unknown as Record<string, unknown>).velocity = function (options?: Partial<VelocityDisplayOptions>) {
  return new (L.Control as unknown as { Velocity: new (options?: unknown) => unknown }).Velocity(options);
};

extendableL.VelocityLayer = (L.Layer ? L.Layer : L.Class).extend(new VelocityLayer());
extendableL.velocityLayer = function (options: Partial<VelocityOptions>) {
  return new (L as unknown as { VelocityLayer: new (options: unknown) => L.Layer }).VelocityLayer(options);
};

declare module 'leaflet' {
  function canvasLayer(): CanvasLayer & Layer;
  function velocityLayer(options: Partial<VelocityOptions>): Layer;

  // eslint-disable-next-line @typescript-eslint/no-namespace -- augmenting @types/leaflet's own namespace
  namespace Control {
    class Velocity extends Control {
      setWindy(windy: unknown): void;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-namespace -- augmenting @types/leaflet's own namespace
  namespace control {
    function velocity(options?: Partial<VelocityDisplayOptions>): Control.Velocity;
  }
}
