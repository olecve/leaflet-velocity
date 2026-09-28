# TODO

## Done

- [x] Recover the TypeScript source (the last known-good version, before another project vendored it as a compiled blob)
- [x] Fix a crash: `stop()` and `evolve()` failed in `animationBucket` when called before `start()`
- [x] Stop mutating the global `window.L`. Extend the imported Leaflet module instead
- [x] Tighten `bilinearInterpolateVector`'s types
- [x] Rename the package to `@olecve/leaflet-velocity`
- [x] Add Prettier
- [x] Add sort-package-json
- [x] Add ESLint with the recommended and typescript-eslint rule sets. Fix all findings
- [x] Add a combined `check` script and GitHub Actions CI
- [x] Replace the webpack and CSS-modules build with plain `tsc`. This produces real ESM output and generated `.d.ts`
      files
- [x] Add types for the Leaflet extension points with a `declare module 'leaflet'` augmentation
- [x] Fix `MapBound.width` and `MapBound.height`. The old wraparound formula was wrong for radian values
- [x] Add tests for `ColorScale` and `Grid`
- [x] Add a Vite dev server for visual and manual testing. It replaces the old script-tag, global-`L` demo
- [x] Fix a real crash found through the dev server: the built layers had no working `onAdd`. The build's ES2020 target
      made class methods non-enumerable, and Leaflet's mixin only copies enumerable properties. Set the build target
      back to ES5 and added a test against the real built output, not just the raw source
- [x] Add knip (unused files, exports, and dependencies)
- [x] Add tests for `Vector`, `Particle`, and `CanvasBound`
- [x] Add a round-trip test for `layer.ts`'s projection math (`mapToCanvas` then `canvasToMap`, plus the edge mappings).
      `distortion`/`distort` still have no dedicated test — a finite-difference approximation that's harder to pin down
      a correct expected value for without more care

## Remaining test coverage

- [ ] Add tests for `L.CanvasLayer.ts` later. It only wires DOM elements and events to Leaflet. The mocking cost is high
      compared with the value the tests would add right now

## On hold

- [ ] Decide where to host this repo: GitHub, GitLab, or local only. This decision is on hold. Revisit it when ready
- [ ] Fix the moderate `npm audit` vulnerability in `@vitest/mocker`. It affects only a dev dependency. The fix needs a
      breaking upgrade to `vitest@5`
