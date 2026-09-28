# @olecve/leaflet-velocity

This is a typescript updated version of [leaflet-velocity](https://github.com/danwild/leaflet-velocity), forked from
[leaflet-velocity-ts](https://github.com/0nza1101/leaflet-velocity-ts).

### Compared to the other versions:

- Compatible with the latest version of leaflet.
- Better particle management when zooming and moving the map, for better performance on mobile devices.
- Extends the Leaflet module you `import`, not a global `window.L`. The original plugin (and earlier versions of this
  fork) assumed a single global `L`, set by loading `leaflet.js` via a `<script>` tag before this plugin's own script —
  an assumption that breaks under a bundler, where more than one copy of Leaflet can exist on the same page.
- Real ESM + generated TypeScript declarations (`tsc`, `declaration: true`) — the original never shipped working types
  for consumers.
- The control's stylesheet (`src/leaflet/leaflet-velocity.css`) is no longer auto-injected — import it explicitly (see
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
  particlelineWidth: 1,
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
