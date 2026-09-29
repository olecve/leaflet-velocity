import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  root: 'demo',
  base: command === 'build' ? '/leaflet-velocity/' : '/',
  build: {
    outDir: '../site-dist',
    emptyOutDir: true,
  },
}));
