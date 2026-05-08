import { defineConfig, devices } from '@playwright/test';

// Each `webServer` block boots a dev server and waits for the URL to respond.
// Playwright reuses an already-running server in dev (`reuseExistingServer`).
// CI runs all three from cold.
//
// CRITICAL: tests must point at the per-app URL via `baseURL` set per project,
// because Playwright supports only one global `baseURL`. We instead use full
// URLs in tests when crossing app boundaries.

const isCI = !!process.env.CI;
const port = (n: number) => `http://localhost:${n}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: false, // SQLite — keep runs serial
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: isCI ? [['html', { open: 'never' }], ['list']] : 'list',
  // Seed the dev.db once before any spec runs. Specs that need to reset
  // mid-suite call `reseed()` from `e2e/setup/seed.ts`.
  globalSetup: './e2e/setup/global-setup.ts',
  use: {
    trace: 'on-first-retry',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev --workspace=@ekonaryn/api',
      url: `${port(4000)}/health`,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev --workspace=@ekonaryn/dashboard',
      url: port(3001),
      reuseExistingServer: !isCI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev --workspace=@ekonaryn/website',
      url: port(3000),
      reuseExistingServer: !isCI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
