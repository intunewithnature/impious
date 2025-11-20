import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  root: '.',
  base: '/',
  publicDir: 'static',
  build: {
    outDir: 'public',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: mode === 'development',
  },
}));
