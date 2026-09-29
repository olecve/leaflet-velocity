import L from 'leaflet';

import Windy, { WindyOptions } from '../core/windy.js';
import CanvasBound from '../core/canvasBound.js';
import MapBound from '../core/mapBound.js';
import Layer from '../core/layer.js';
import CanvasLayer from './L.CanvasLayer.js';
import { VelocityOptions, WindDataRecord } from '../types.js';

type VelocityLayerMapEvents = Record<'dragstart' | 'dragend' | 'zoomstart' | 'zoomend' | 'resize', () => void>;

export default class VelocityLayer {
  // Provided by Leaflet's Evented mixin once .extend() merges this class in (see index.ts) — not implemented here.
  declare fire: (type: string, data?: unknown, propagate?: boolean) => this;

  private options: Partial<VelocityOptions>;
  private _map: L.Map = null;
  private _canvasLayer: CanvasLayer & L.Layer = null;
  private _windy: Windy = null;
  private _context: CanvasRenderingContext2D = null;
  private _displayTimeout: ReturnType<typeof setTimeout> = null;
  private _mapEvents: VelocityLayerMapEvents = null;
  private _mouseControl: L.Control.Velocity | false | null = null;
  private _paneName: string = null;

  constructor() {
    this.options = {
      displayValues: true,
      displayOptions: {
        velocityType: 'Velocity',
        position: 'bottomleft',
        emptyString: 'No velocity data',
        angleConvention: 'bearingCCW',
        speedUnit: 'm/s',
      },
      maxVelocity: 10, // used to align color scale
      colorScale: null,
      onAdd: null,
      onRemove: null,
      data: null,
      paneName: 'overlayPane',
    };
  }

  initialize(options: Partial<VelocityOptions>) {
    L.Util.setOptions(this, options);
  }

  setOptions(options: Partial<VelocityOptions>) {
    this.options = { ...this.options, ...options };
    if (options.displayOptions) {
      this.options.displayOptions = { ...this.options.displayOptions, ...options.displayOptions };
      this.initMouseHandler(true);
    }

    if (options.data) {
      this.options.data = options.data;
    }

    if (this._windy) {
      this._windy.setOptions(options);
      if (options.data) {
        this._windy.setData(options.data);
      }
      this.clearAndRestart();
    }

    this.fire('load');
  }

  onAdd(map: L.Map) {
    this._paneName = this.options.paneName || 'overlayPane';

    // ensure the pane exists (attempt to get it first to preserve parent - createPane voids this)
    if (!map.getPane(this._paneName)) {
      map.createPane(this._paneName);
    }

    // create canvas, add overlay control
    this._canvasLayer = L.canvasLayer().delegate(this) as CanvasLayer & L.Layer;
    this._canvasLayer.addTo(map);

    this._map = map;

    if (this.options.onAdd) this.options.onAdd();
  }

  onRemove(_map: L.Map) {
    this.destroyWind();

    if (this.options.onRemove) this.options.onRemove();
  }

  setData(data: WindDataRecord[]) {
    this.options.data = data;

    if (this._windy) {
      this._windy.setData(data);
      this.clearAndRestart();
    }

    this.fire('load');
  }

  onDrawLayer() {
    if (!this._windy) {
      this.initWindy();
      return;
    }

    if (!this.options.data) {
      return;
    }

    if (this._displayTimeout) clearTimeout(this._displayTimeout);

    this._displayTimeout = setTimeout(() => {
      this.startWindy();
    }, 150); // showing velocity is delayed
  }

  private toggleEvents(bind: boolean = true) {
    if (this._mapEvents === null) {
      this._mapEvents = {
        dragstart: () => {
          this._windy.stop();
        },
        dragend: () => {
          this.clearAndRestart();
        },
        zoomstart: () => {
          this._windy.stop();
        },
        zoomend: () => {
          this.clearAndRestart();
        },
        resize: () => {
          this.clearWind();
        },
      };
    }

    for (const e in this._mapEvents) {
      if (Object.prototype.hasOwnProperty.call(this._mapEvents, e)) {
        this._map[bind ? 'on' : 'off'](e, this._mapEvents[e as keyof VelocityLayerMapEvents]);
      }
    }
  }

  private initWindy() {
    const options: WindyOptions = {
      ...this.options,
      canvas: this._canvasLayer.getCanvas(),
    };
    this._windy = new Windy(options);

    // prepare context global var, start drawing
    this._context = this._canvasLayer.getCanvas().getContext('2d');
    this._canvasLayer.getCanvas().classList.add('velocity-overlay');
    this.onDrawLayer();

    this.toggleEvents(true);

    this.initMouseHandler();
  }

  private initMouseHandler(unbind: boolean = false) {
    if (unbind) {
      this._map.removeControl(this._mouseControl as L.Control.Velocity);
      this._mouseControl = false;
    }

    if (!this._mouseControl && this.options.displayValues) {
      const options = this.options.displayOptions || {};
      this._mouseControl = L.control.velocity(options);
      this._mouseControl.setWindy(this._windy);
      this._mouseControl.setOptions(this.options.displayOptions);
      this._mouseControl.addTo(this._map);
    }
  }

  private startWindy() {
    const bounds = this._map.getBounds();
    const size = this._map.getSize();

    // bounds, width, height, extent
    this._windy.start(
      new Layer(
        new MapBound(
          this._map,
          bounds.getNorthEast().lat,
          bounds.getNorthEast().lng,
          bounds.getSouthWest().lat,
          bounds.getSouthWest().lng,
        ),
        new CanvasBound(0, 0, size.x, size.y),
      ),
    );
  }

  private clearAndRestart() {
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
    if (this._windy) this.startWindy();
  }

  private clearWind() {
    if (this._windy) this._windy.stop();
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
  }

  private destroyWind() {
    if (this._displayTimeout) clearTimeout(this._displayTimeout);
    if (this._windy) this._windy.stop();
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
    if (this._mouseControl) this._map.removeControl(this._mouseControl);
    this._mouseControl = null;
    this._windy = null;
    this.toggleEvents(false);
    this._map.removeLayer(this._canvasLayer);
  }
}
