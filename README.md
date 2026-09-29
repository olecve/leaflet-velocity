# @olecve/leaflet-velocity

[![npm version](https://img.shields.io/npm/v/@olecve/leaflet-velocity.svg)](https://www.npmjs.com/package/@olecve/leaflet-velocity)
[![CI](https://github.com/olecve/leaflet-velocity/actions/workflows/ci.yml/badge.svg)](https://github.com/olecve/leaflet-velocity/actions/workflows/ci.yml)

A Leaflet plugin that animates gridded wind data (U/V vector components, e.g. from a GFS forecast) as a moving field of
particles over the map, with an optional hover control showing speed and direction at the cursor.

Forked from [leaflet-velocity-ts](https://github.com/0nza1101/leaflet-velocity-ts), itself a TypeScript port of the
original [leaflet-velocity](https://github.com/danwild/leaflet-velocity).

[Live demo](https://olecve.github.io/leaflet-velocity/)

### Compared to the other versions:

- Compatible with the latest version of leaflet.
- Better particle management when zooming and moving the map, for better performance on mobile devices.
- Extends the Leaflet module you `import`, not a global `window.L`. The original plugin (and earlier versions of this
  fork) assumed a single global `L`, set by loading `leaflet.js` via a `<script>` tag before this plugin's own script.
  That assumption breaks under a bundler, where more than one copy of Leaflet can exist on the same page.
- Real ESM + generated TypeScript declarations (`tsc`, `declaration: true`). The original never shipped working types
  for consumers.
- The control's stylesheet (`src/leaflet/leaflet-velocity.css`) is no longer auto-injected. Import it explicitly (see
  below).

## Example use:

```javascript
import '@olecve/leaflet-velocity';
import '@olecve/leaflet-velocity/src/leaflet/leaflet-velocity.css'; // only needed if displayValues is enabled
import L from 'leaflet';

const velocityLayer = L.velocityLayer({
  displayValues: true,
  displayOptions: {
    showCardinal: true,
    velocityType: 'Global Wind',

    // 'topleft' | 'topright' | 'bottomleft' | 'bottomright'
    position: 'bottomleft',

    // no data at cursor

    emptyString: 'No velocity data',

    // direction label prefix
    directionString: 'Direction',

    // speed label prefix
    speedString: 'Speed',

    // 'kt' | 'k/h' | 'mph' | 'm/s'
    speedUnit: 'm/s',

    // Could be any combination of 'bearing' (angle toward which the flow goes) or
    // 'meteo' (angle from which the flow comes) and 'CW' (angle value increases clock-wise)
    // or 'CCW' (angle value increases counter clock-wise)
    angleConvention: 'bearingCW',
  },
  // see demo/data.js, or wind-js-server for example data service
  data: data,

  // OPTIONAL
  particleAge: 64,
  particleMultiplier: 0.0033,
  particleLineWidth: 1,
  frameRate: 15,
  minVelocity: 0,
  maxVelocity: 10,
  velocityScale: 0.005,
  opacity: 0.97,
  // define your own array of hex/rgb colors
  colorScale: [],
  onAdd: () => console.log('onAdd'),
  onRemove: () => console.log('onRemove'),
  // optional pane to add the layer, will be created if doesn't exist
  // leaflet v1+ only (falls back to overlayPane for < v1)
  paneName: 'overlayPane',
});

velocityLayer.addTo(mymap);
```

## License

MIT License (MIT)
