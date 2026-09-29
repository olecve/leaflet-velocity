import Vector from './vector.js';
import Grid from './grid.js';
import ColorScale from './colorScale.js';
import Particule from './particle.js';
import AnimationBucket from './animationBucket.js';
import Layer from './layer.js';
import { WindDataRecord, WindySimulationOptions } from '../types.js';
import { validateWindData } from './windDataValidation.js';

export type WindyOptions = Partial<WindySimulationOptions> & {
  canvas: HTMLCanvasElement;
};
export default class Windy {
  private grid: Grid;
  private canvas: HTMLCanvasElement = null;
  private colorScale: ColorScale;
  private velocityScale: number;
  private particleMultiplier = 1 / 300;
  private particleAge: number;
  private particleLineWidth: number;
  private autoColorRange = false;
  private opacity: number;

  private layer: Layer;
  private particules: Particule[] = [];
  private animationBucket: AnimationBucket;
  private context2D: CanvasRenderingContext2D;
  private animationLoop: number = null;
  private frameTime: number;
  private then = 0;

  constructor(options: WindyOptions) {
    this.setOptions(options);
    this.canvas = options.canvas;
    if (options.data) {
      this.setData(options.data);
    }
  }

  public setOptions(options: Omit<WindyOptions, 'canvas'>) {
    if (options.minVelocity === undefined && options.maxVelocity === undefined) {
      this.autoColorRange = true;
    }
    this.colorScale = new ColorScale(options.minVelocity || 0, options.maxVelocity || 10, options.colorScale);
    this.velocityScale = options.velocityScale || 0.01;
    this.particleAge = options.particleAge || 64;
    this.opacity = +options.opacity || 0.97;

    this.particleMultiplier = options.particleMultiplier || 1 / 300;
    this.particleLineWidth = options.particleLineWidth || 1;
    const frameRate = options.frameRate || 15;
    this.frameTime = 1000 / frameRate;
  }

  public get particuleCount() {
    const particuleReduction = /android|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos/i.test(
      navigator.userAgent,
    )
      ? Math.pow(window.devicePixelRatio, 1 / 3) || 1.6
      : 1;
    return (
      Math.round(this.layer.canvasBound.width * this.layer.canvasBound.height * this.particleMultiplier) *
      particuleReduction
    );
  }

  /**
   * Load data
   * @param data
   */
  public setData(data: WindDataRecord[]) {
    let uData: WindDataRecord = null;
    let vData: WindDataRecord = null;
    const grid: Vector[] = [];

    data.forEach(record => {
      switch (`${record.header.parameterCategory},${record.header.parameterNumber}`) {
        case '1,2':
        case '2,2':
          uData = record;
          break;
        case '1,3':
        case '2,3':
          vData = record;
          break;
        default:
      }
    });

    if (!uData || !vData) {
      console.warn('Data are not correct format');
      return;
    }

    const validationError = validateWindData(uData, vData);
    if (validationError) {
      console.warn(validationError);
      return;
    }

    uData.data.forEach((u: number, index: number) => {
      grid.push(new Vector(u, vData.data[index]));
    });

    //console.log('uData', uData);
    //console.log('vData', vData);

    this.grid = new Grid(
      grid,
      uData.header.la1,
      uData.header.lo1,
      uData.header.dy,
      uData.header.dx,
      uData.header.ny,
      uData.header.nx,
    );

    if (this.autoColorRange) {
      const minMax = this.grid.valueRange;
      this.colorScale.setMinMax(minMax[0], minMax[1]);
    }
  }

  /* Get interpolated grid value from Lon/Lat position
   * @param λ {Float} Longitude
   * @param φ {Float} Latitude
   * @returns {Object}
   */
  public interpolate(λ: number, φ: number): [number, number, number] | null {
    if (!this.grid) {
      return null;
    }
    const wind = this.grid.get(λ, φ);
    return [wind.u, wind.v, wind.intensity];
  }

  public start(layer: Layer) {
    this.context2D = this.canvas.getContext('2d');
    this.context2D.lineWidth = this.particleLineWidth;
    this.context2D.fillStyle = `rgba(0, 0, 0, ${this.opacity})`;
    this.context2D.globalAlpha = 0.6;

    this.layer = layer;
    this.animationBucket = new AnimationBucket(this.colorScale);

    this.particules.splice(0, this.particules.length);
    for (let i = 0; i < this.particuleCount; i++) {
      this.particules.push(this.layer.canvasBound.getRandomParticule(this.particleAge));
    }

    this.then = new Date().getTime();

    this.frame();
  }

  public stop() {
    this.particules.splice(0, this.particules.length);
    if (this.animationBucket) this.animationBucket.clear();
    if (this.animationLoop) {
      clearTimeout(this.animationLoop);
      this.animationLoop = null;
    }
  }

  private getParticuleWind(p: Particule): Vector {
    const lngLat = this.layer.canvasToMap(p.x, p.y);
    const wind = this.grid.get(lngLat[0], lngLat[1]);
    p.intensity = wind.intensity;
    const mapArea = this.layer.mapBound.height * this.layer.mapBound.width;
    const velocityScale = this.velocityScale * Math.pow(mapArea, 0.4);
    this.layer.distort(lngLat[0], lngLat[1], p.x, p.y, velocityScale, wind);
    return wind;
  }

  private frame() {
    this.animationLoop = requestAnimationFrame(() => {
      this.frame();
    });
    const now = new Date().getTime();
    const delta = now - this.then;
    if (delta > this.frameTime) {
      this.then = now - (delta % this.frameTime);
      this.evolve();
      this.draw();
    }
  }

  private evolve() {
    if (this.animationBucket) this.animationBucket.clear();
    this.particules.forEach((p: Particule) => {
      p.grow();
      if (p.isDead) {
        this.layer.canvasBound.resetParticule(p);
      }
      const wind = this.getParticuleWind(p);
      this.animationBucket.add(p, wind);
    });
  }

  private draw() {
    this.context2D.globalCompositeOperation = 'destination-in';
    this.context2D.fillRect(
      this.layer.canvasBound.xMin,
      this.layer.canvasBound.yMin,
      this.layer.canvasBound.width,
      this.layer.canvasBound.height,
    );
    // Fade existing particle trails.
    this.context2D.globalCompositeOperation = 'lighter';
    this.context2D.globalAlpha = this.opacity === 0 ? 0 : this.opacity * 0.9;

    this.animationBucket.draw(this.context2D);
  }
}
