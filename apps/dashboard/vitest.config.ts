/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirror the `@/*` -> `./src/*` mapping in tsconfig.json so production
      // imports work unchanged in tests.
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
      exclude: [
        'src/**/*.d.ts',
        'src/app/layout.tsx', // RSC, not exercised by jsdom unit tests
      ],
      // Phase 4 baseline. Branches/functions trail lines slightly because the
      // unaudited list pages (analytics, financial, materials, routes, schedule,
      // trips) drag the average down — they're tracked in TEST_PLAN.md for a
      // future sweep. Bumping these triggers a real regression catch.
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 70,
      },
    },
  },
});
