/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/*.d.ts'],
      // Activated immediately — Phase 3.4 verifies the suite hits these.
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        // Some defensive branches in zod schemas are unreachable from outside;
        // 95 leaves headroom while still catching real regressions.
        branches: 95,
      },
    },
  },
});
