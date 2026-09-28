# TODO

## Done

- [x] Recover TS source (last known-good state before it was vendored elsewhere as a compiled blob)
- [x] Fix `animationBucket` crash in `stop()`/`evolve()` when called before `start()`
- [x] Fix global `window.L` mutation — extend the imported Leaflet module instead
- [x] Tighten `bilinearInterpolateVector`'s types
- [x] Rename package to `@olecve/leaflet-velocity`
- [x] Add Prettier
- [x] Add sort-package-json
- [x] Add ESLint (recommended + typescript-eslint), resolve all findings
- [x] Add combined `check` script + GitHub Actions CI
- [x] Replace webpack + CSS-modules build with plain `tsc` (real ESM + generated `.d.ts`)
- [x] Properly type the Leaflet extension points (`declare module 'leaflet'` augmentation)
- [x] Fix `MapBound.width`/`height` (broken wraparound formula on radian values)
- [x] Add tests for `ColorScale` and `Grid`
- [x] Dev server for visual/manual testing (Vite + ESM demo, replacing the old script-tag/global-`L` version)

## Remaining test coverage

- [ ] `Vector` — trivial (`intensity` getter), but currently untested
- [ ] `Particle` — `reset`, `isDead`, `grow`
- [ ] `CanvasBound` — `width`/`height`, `getRandomParticule`/`resetParticule` (random within bounds)
- [ ] `layer.ts` — the actual projection math (`canvasToMap`, `mapToCanvas`, `distortion`, `distort`); worth at least a
      round-trip sanity check (`mapToCanvas` then `canvasToMap` returns close to the original point)
- [ ] `L.CanvasLayer.ts` — thin Leaflet-integration glue (DOM + event wiring); lower priority, expensive to mock for the
      value it'd add

## Parked / needs a decision

- [ ] Hosting for this repo (GitHub vs GitLab vs stay local) — explicitly deferred, revisit when ready
- [ ] `npm audit` moderate vulnerability in `@vitest/mocker` (dev-only; fix requires a breaking `vitest@5` bump)
