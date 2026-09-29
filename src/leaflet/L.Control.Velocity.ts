import L from 'leaflet';

import Windy from '../core/windy.js';
import { VelocityDisplayOptions } from '../types.js';
import { degreesToCardinalDirection } from './degreesToCardinalDirection.js';

// Ship src/leaflet/leaflet-velocity.css as a plain stylesheet for consumers to import themselves.
const LEAFLET_VELOCITY_CONTROL_CLASS = 'leaflet-velocity-control';

export default class ControlVelocity {
  private options: VelocityDisplayOptions;
  private _windy: Windy = null;
  private _map: L.Map = null;
  private _container: HTMLElement = null;

  constructor() {
    this.options = {
      position: 'bottomleft',
      emptyString: 'Unavailable',
      velocityType: '',
      angleConvention: 'bearingCCW',
      speedUnit: 'm/s',
      directionString: 'Direction',
      speedString: 'Speed',
      showCardinal: false,
    };
  }

  setWindy(_windy: Windy) {
    if (!this._windy && _windy) this._windy = _windy;
  }

  setOptions(options: Partial<VelocityDisplayOptions>) {
    L.Util.setOptions(this, options);
  }

  onAdd(map: L.Map) {
    this._map = map;
    this._container = L.DomUtil.create('div', LEAFLET_VELOCITY_CONTROL_CLASS);
    L.DomEvent.disableClickPropagation(this._container);
    this._map.on('mousemove', this.drawWindSpeed, this);
    this._container.innerHTML = this.options.emptyString;
    return this._container;
  }

  onRemove(_map: L.Map) {
    this._map.off('mousemove', this.drawWindSpeed, this);
  }

  vectorToSpeed(uMs: number, vMs: number, unit: string) {
    const velocityAbs = Math.sqrt(Math.pow(uMs, 2) + Math.pow(vMs, 2));
    // Default is m/s
    if (unit === 'k/h') {
      return this.meterSec2kilometerHour(velocityAbs);
    } else if (unit === 'kt') {
      return this.meterSec2Knots(velocityAbs);
    } else if (unit === 'mph') {
      return this.meterSec2milesHour(velocityAbs);
    } else {
      return velocityAbs;
    }
  }

  vectorToDegrees(uMs: number, vMs: number, angleConvention: string) {
    // Default angle convention is CW
    if (angleConvention.endsWith('CCW')) {
      // vMs comes out upside-down..
      vMs = vMs > 0 ? -vMs : Math.abs(vMs);
    }
    const velocityAbs = Math.sqrt(Math.pow(uMs, 2) + Math.pow(vMs, 2));

    const velocityDir = Math.atan2(uMs / velocityAbs, vMs / velocityAbs);
    let velocityDirToDegrees = (velocityDir * 180) / Math.PI + 180;

    if (angleConvention === 'bearingCW' || angleConvention === 'meteoCCW') {
      velocityDirToDegrees += 180;
      if (velocityDirToDegrees >= 360) velocityDirToDegrees -= 360;
    }

    return velocityDirToDegrees;
  }

  meterSec2Knots(meters: number) {
    return meters / 0.514;
  }

  meterSec2kilometerHour(meters: number) {
    return meters * 3.6;
  }

  meterSec2milesHour(meters: number) {
    return meters * 2.23694;
  }

  drawWindSpeed(ev: L.LeafletMouseEvent) {
    const pos = this._map.containerPointToLatLng(L.point(ev.containerPoint.x, ev.containerPoint.y));
    const gridValue = this._windy.interpolate(pos.lng, pos.lat);
    let template = '';
    if (gridValue && !isNaN(gridValue[0]) && !isNaN(gridValue[1]) && gridValue[2]) {
      const deg = this.vectorToDegrees(gridValue[0], gridValue[1], this.options.angleConvention);
      const cardinal = this.options.showCardinal ? ` (${degreesToCardinalDirection(deg)}) ` : '';
      template = `<strong> ${this.options.velocityType} ${
        this.options.directionString
      }: </strong> ${deg.toFixed(2)}°${cardinal}, <strong> ${this.options.velocityType} ${
        this.options.speedString
      }: </strong> ${this.vectorToSpeed(gridValue[0], gridValue[1], this.options.speedUnit).toFixed(2)} ${this.options.speedUnit}`;
    } else {
      if (this.options.emptyString) template = this.options.emptyString;
    }
    this._container.innerHTML = template;
  }
}
