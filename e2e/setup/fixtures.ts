import { test as base, expect } from '@playwright/test';

export const URLS = {
  api: 'http://localhost:4000/api/v1',
  dashboard: 'http://localhost:3001',
  website: 'http://localhost:3000',
} as const;

export const SEED = {
  admin: { phone: '+996700000001', password: 'admin123' },
  workerActive: { phone: '+996700000002', password: 'worker123' },
  workerOffShift: { phone: '+996700000004', password: 'worker123' },
  workerPending: { phone: '+996700000005', password: 'worker123' },
  resident: { phone: '+996700100001', password: 'resident123' },
} as const;

// `test` is the Playwright test runner with a single helper added: `apiLogin`
// posts directly to /auth/login and returns the JWT — useful for setting up
// auth state without going through the dashboard's login UI.
export const test = base.extend<{
  apiLogin: (creds: { phone: string; password: string }) => Promise<string>;
}>({
  apiLogin: async ({ request }, use) => {
    use(async (creds) => {
      const r = await request.post(`${URLS.api}/auth/login`, { data: creds });
      if (!r.ok()) {
        throw new Error(`apiLogin failed: ${r.status()} ${await r.text()}`);
      }
      const body = await r.json();
      return body.data.accessToken as string;
    });
  },
});

export { expect };
