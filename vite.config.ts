import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: 'app',
  cacheDir: '../node_modules/.vite',
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true },
  // `npm run dev:ui` reloads instantly; the API comes from the Worker started by `npm run dev`.
  server: { proxy: { '/api': 'http://localhost:8787' } },
  test: {
    environment: 'jsdom',
    include: ['**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
  },
});
