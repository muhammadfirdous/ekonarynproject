/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      // layout.tsx is an RSC that calls next/headers cookies() — not exercisable
      // from jsdom. tests/seo.test.ts pins the metadata export separately.
      exclude: ['src/**/*.d.ts', 'src/app/layout.tsx'],
      // Phase 5 baseline (98.99 lines / 93.7 branches / 82.22 funcs measured).
      // The functions number is held back by the ImpactCounter count-up timer
      // we deliberately don't trigger in jsdom; bumping floors here would
      // catch real regressions across the small website surface area.
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 80,
        branches: 85,
      },
    },
  },
});
