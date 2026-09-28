import '../dist/index.js';
import '../src/leaflet/leaflet-velocity.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import data from './data.js';

// Centered on the strongest wind in this dataset (~32 m/s near 20°N 130°E) so the animation is obvious immediately.
const map = L.map('mapid', { attributionControl: false }).setView([20, 130], 4);

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
