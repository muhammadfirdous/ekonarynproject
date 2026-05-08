/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/teardown.ts',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 15000,
  // SQLite locks the file under parallel writes — keep tests serial. The suite is
  // small enough that this is also fastest in wall-clock terms.
  maxWorkers: 1,
  coverageProvider: 'v8',
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts', '!src/**/*.d.ts'],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  // Activated at the end of Phase 2. Phase 2 final coverage:
  //   services 100/97.6, middleware 96.6/90.3, routes 94.6/77.5, utils 100/90.
  // Thresholds match the per-area spec; CI fails on any regression.
  coverageThreshold: {
    './src/services/': { lines: 95, branches: 90 },
    './src/middleware/': { lines: 95, branches: 90 },
    './src/routes/': { lines: 85, branches: 75 },
    './src/utils/': { lines: 90, branches: 80 },
  },
};
