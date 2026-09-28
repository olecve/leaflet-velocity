export type SpeedUnit = 'kt' | 'k/h' | 'mph' | 'm/s';
export type Position = 'topleft' | 'topright' | 'bottomleft' | 'bottomright';

export interface VelocityDisplayOptions {
  speedUnit: SpeedUnit;
  position: Position;
  showCardinal: boolean;
  angleConvention: string;
  velocityType: string;
  emptyString: string;
  directionString: string;
  speedString: string;
}

export interface WindDataHeader {
  parameterCategory: number;
  parameterNumber: number;
  la1: number;
  lo1: number;
  dx: number;
  dy: number;
  nx: number;
  ny: number;
}

export interface WindDataRecord {
  header: WindDataHeader;
  data: number[];
}

export interface VelocityOptions {
  displayValues: boolean;
  displayOptions: Partial<VelocityDisplayOptions>;
  data: WindDataRecord[]; // see demo/data.js, or wind-js-server for example data service
  // OPTIONAL
  particleAge: number;
  particleMultiplier: number;
  particleLineWidth: number;
  frameRate: number;
  minVelocity: number;
  maxVelocity: number;
  velocityScale: number;
  colorScale: string[];
  opacity: number;
  onAdd: () => void;
  onRemove: () => void;
  paneName: string;
}
