import '../dist/index.js';
import '../src/leaflet/leaflet-velocity.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import type { VelocityOptions } from '../dist/index.js';

import data from './data.js';

// Centered on the strongest wind in this dataset (~35 m/s near 20°N 164°W) so the animation is obvious immediately.
const map = L.map('mapid', { attributionControl: false }).setView([20, -164], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
}).addTo(map);

const velocity = L.velocityLayer({
  displayValues: true,
  displayOptions: {
    position: 'bottomleft',
    emptyString: 'No velocity data',
    angleConvention: 'bearingCW',
    speedUnit: 'kt',
    showCardinal: true,
  },
  data,
  maxVelocity: 10,
  opacity: 1,
});

map.addLayer(velocity);

document.getElementById('remove')!.addEventListener('click', () => map.removeLayer(velocity));
document.getElementById('add')!.addEventListener('click', () => map.addLayer(velocity));

// Playback comparison: setData() (hard reset) vs updateData() (smooth); dataB swaps u/v to simulate the next frame.
const [uRecord, vRecord] = data;
const dataB = [
  { header: uRecord.header, data: vRecord.data },
  { header: vRecord.header, data: uRecord.data },
];

const statsEl = document.getElementById('stats')!;
const setDataButton = document.getElementById('play-set-data')!;
const updateDataButton = document.getElementById('play-update-data')!;

let intervalId: ReturnType<typeof setInterval> | null = null;
let activeMethod: 'setData' | 'updateData' | null = null;
let onFrameB = false;
let frameCount = 0;
let clearCount = 0;

function instrumentCanvasClearRect() {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas.velocity-overlay');
  const ctx = canvas?.getContext('2d') as (CanvasRenderingContext2D & { __instrumented?: boolean }) | null;
  if (!ctx || ctx.__instrumented) return;
  ctx.__instrumented = true;
  const origClearRect = ctx.clearRect.bind(ctx);
  ctx.clearRect = (...args: Parameters<typeof origClearRect>) => {
    clearCount++;
    renderStats();
    return origClearRect(...args);
  };
}

function renderStats() {
  const label = activeMethod ? `playing via ${activeMethod}()` : 'stopped';
  statsEl.textContent = `${label} · frames: ${frameCount} · canvas clears: ${clearCount}`;
}

function stopPlayback() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  activeMethod = null;
  setDataButton.textContent = 'Play via setData() (hard reset)';
  updateDataButton.textContent = 'Play via updateData() (smooth)';
  renderStats();
}

function startPlayback(method: 'setData' | 'updateData') {
  stopPlayback();
  activeMethod = method;
  frameCount = 0;
  clearCount = 0;
  onFrameB = false;
  instrumentCanvasClearRect();
  renderStats();

  const button = method === 'setData' ? setDataButton : updateDataButton;
  button.textContent = `Stop (${method === 'setData' ? 'hard reset' : 'smooth'})`;

  intervalId = setInterval(() => {
    onFrameB = !onFrameB;
    velocity[method](onFrameB ? dataB : data);
    frameCount++;
    renderStats();
  }, 1000);
}

setDataButton.addEventListener('click', () => {
  if (activeMethod === 'setData') stopPlayback();
  else startPlayback('setData');
});
updateDataButton.addEventListener('click', () => {
  if (activeMethod === 'updateData') stopPlayback();
  else startPlayback('updateData');
});

// Presets: setOptions() calls, each changing particle density, speed, trail length, or color.
// colorScale: [] falls back to the library's built-in palette (see ColorScale's constructor).
type PresetName = 'default' | 'dense-slow' | 'sparse-fast' | 'long-trails' | 'blue-palette';

const presets: Record<PresetName, Partial<VelocityOptions>> = {
  default: { particleMultiplier: 1 / 300, velocityScale: 0.01, particleAge: 64, opacity: 0.97, colorScale: [] },
  'dense-slow': { particleMultiplier: 0.01, velocityScale: 0.002, particleAge: 64, opacity: 0.97, colorScale: [] },
  'sparse-fast': { particleMultiplier: 0.001, velocityScale: 0.02, particleAge: 64, opacity: 0.97, colorScale: [] },
  'long-trails': { particleMultiplier: 1 / 300, velocityScale: 0.01, particleAge: 160, opacity: 0.99, colorScale: [] },
  'blue-palette': {
    particleMultiplier: 1 / 300,
    velocityScale: 0.01,
    particleAge: 64,
    opacity: 0.97,
    colorScale: ['rgb(202, 221, 236)', 'rgb(150, 180, 230)', 'rgb(90, 140, 230)', 'rgb(40, 85, 230)'],
  },
};

const presetSelect = document.getElementById('preset') as HTMLSelectElement;
const presetInfo = document.getElementById('preset-info')!;

function applyPreset(name: PresetName) {
  const preset = presets[name];
  velocity.setOptions(preset);
  const multiplier = preset.particleMultiplier!.toFixed(4);
  presetInfo.textContent = [
    `particleMultiplier: ${multiplier}`,
    `velocityScale: ${preset.velocityScale}`,
    `particleAge: ${preset.particleAge}`,
    `opacity: ${preset.opacity}`,
  ].join('\n');
}

presetSelect.addEventListener('change', () => applyPreset(presetSelect.value as PresetName));
applyPreset('default');
