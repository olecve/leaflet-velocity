import L from 'leaflet';

import CanvasBound from './canvasBound';
import MapBound from './mapBound';
import Windy from './windy';
import CanvasLayer from './L.CanvasLayer';
import VelocityLayer from './L.VelocityLayer';
import ControlVelocity from './L.Control.Velocity';

export { CanvasBound, MapBound, Windy };

// Extend the Leaflet module this file imported, not the global `window.L`. The
// original plugin was written to be loaded via <script> tag after leaflet.js,
// where a shared global L was the whole point. Under a bundler, a host page
// can have its own separate Leaflet instance racing for that global slot —
// patching the imported module directly instead means this always attaches to
// the exact Leaflet instance this package (and its consumer) actually uses,
// with no dependency on load order or how many Leaflet copies exist on the page.
const anyL = L as any;

anyL.CanvasLayer = (L.Layer ? L.Layer : L.Class).extend(new CanvasLayer());
anyL.canvasLayer = function () {
  return new anyL.CanvasLayer();
};

anyL.Control.Velocity = L.Control.extend(new ControlVelocity());
anyL.control.velocity = function (options: any) {
  return new anyL.Control.Velocity(options);
};

anyL.VelocityLayer = (L.Layer ? L.Layer : L.Class).extend(new VelocityLayer());
anyL.velocityLayer = function (options: any) {
  return new anyL.VelocityLayer(options);
};
