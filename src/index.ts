import L from 'leaflet';

import CanvasBound from './core/canvasBound.js';
import MapBound from './core/mapBound.js';
import Windy from './core/windy.js';
import CanvasLayer from './leaflet/L.CanvasLayer.js';
import VelocityLayer from './leaflet/L.VelocityLayer.js';
import ControlVelocity from './leaflet/L.Control.Velocity.js';
import {
  Position,
  SpeedUnit,
  VelocityDisplayOptions,
  VelocityOptions,
  WindDataHeader,
  WindDataRecord,
} from './types.js';

export { CanvasBound, MapBound, Windy };
export type { Position, SpeedUnit, VelocityDisplayOptions, VelocityOptions, WindDataHeader, WindDataRecord };

// Extends the imported L, not window.L — see README. The .extend() mixin pattern is inherently untypeable, hence the casts.
const extendableL = L as unknown as Record<string, unknown>;

extendableL.CanvasLayer = L.Layer.extend(new CanvasLayer());
extendableL.canvasLayer = function () {
  return new (L as unknown as { CanvasLayer: new () => CanvasLayer }).CanvasLayer();
};

(L.Control as unknown as Record<string, unknown>).Velocity = L.Control.extend(new ControlVelocity());
(L.control as unknown as Record<string, unknown>).velocity = function (options?: Partial<VelocityDisplayOptions>) {
  return new (
    L.Control as unknown as { Velocity: new (options?: Partial<VelocityDisplayOptions>) => L.Control.Velocity }
  ).Velocity(options);
};

extendableL.VelocityLayer = L.Layer.extend(new VelocityLayer());
extendableL.velocityLayer = function (options: Partial<VelocityOptions>) {
  return new (L as unknown as { VelocityLayer: new (options: Partial<VelocityOptions>) => L.Layer }).VelocityLayer(
    options,
  );
};

declare module 'leaflet' {
  function canvasLayer(): CanvasLayer & Layer;
  function velocityLayer(options: Partial<VelocityOptions>): Layer;

  // eslint-disable-next-line @typescript-eslint/no-namespace -- augmenting @types/leaflet's own namespace
  namespace Control {
    class Velocity extends Control {
      setWindy(windy: Windy): void;
      setOptions(options: Partial<VelocityDisplayOptions>): void;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-namespace -- augmenting @types/leaflet's own namespace
  namespace control {
    function velocity(options?: Partial<VelocityDisplayOptions>): Control.Velocity;
  }
}
