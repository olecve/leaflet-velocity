import '../dist/index.js';
import '../src/leaflet/leaflet-velocity.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
