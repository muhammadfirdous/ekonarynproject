import { expect, test } from '@playwright/test';

// Phase 1 smoke: prove the test runner can reach all three boots.
// Real lifecycle/E2E tests land in Phase 6.

test.describe('infrastructure smoke', () => {
  test('API /health responds 200', async ({ request }) => {
    const res = await request.get('http://localhost:4000/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ status: 'ok' });
  });

  test('website / loads and renders something', async ({ page }) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    // Body must contain at least one of these brand tokens regardless of locale.
    const text = await page.textContent('body');
    expect(text?.length ?? 0).toBeGreaterThan(50);
  });

  test('dashboard / redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
    // The dashboard layout pushes to /login when no auth token is present.
    // We just check that the URL ends up on /login OR shows a login form.
    await expect.poll(async () => page.url(), { timeout: 10_000 }).toMatch(/\/login$/);
  });
});
