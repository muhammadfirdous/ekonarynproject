import { test, expect, URLS, SEED } from './setup/fixtures';
import { reseed } from './setup/seed';

// E2E auth contract:
//   1. Dashboard / redirects unauth → /login.
//   2. Admin can log in via the form and lands on / (the overview).
//   3. Wrong password surfaces an inline error.
//   4. Non-admin role (resident/worker) is rejected with the "Admin only" message.
//   5. Logging out clears the local token and bounces back to /login.

test.beforeAll(() => {
  // Each spec file starts on a freshly seeded DB so prior specs can't leak in.
  reseed();
});

test.describe('Dashboard auth', () => {
  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    await page.goto(URLS.dashboard, { waitUntil: 'domcontentloaded' });
    await expect.poll(async () => page.url(), { timeout: 10_000 }).toMatch(/\/login$/);
  });

  test('admin signs in and lands on the overview', async ({ page }) => {
    await page.goto(`${URLS.dashboard}/login`);
    await page.getByPlaceholder('+996700000001').fill(SEED.admin.phone);
    await page.getByPlaceholder('••••••').fill(SEED.admin.password);
    await page.getByRole('button', { name: /sign in|войти/i }).click();
    await expect.poll(async () => page.url(), { timeout: 10_000 }).toMatch(/\/$|\/\?/);
    // The Sidebar has "Overview" / "Обзор" — assert it landed.
    await expect(page.locator('aside')).toBeVisible();
  });

  test('wrong password surfaces an inline error and stays on /login', async ({ page }) => {
    await page.goto(`${URLS.dashboard}/login`);
    await page.getByPlaceholder('+996700000001').fill(SEED.admin.phone);
    await page.getByPlaceholder('••••••').fill('not-the-password');
    await page.getByRole('button', { name: /sign in|войти/i }).click();
    // The /login screen should still be present and an error banner visible.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('.bg-red-50, [class*="bg-red"]')).toBeVisible();
  });

  test('resident credentials are rejected with the "Admin only" guard', async ({ page }) => {
    await page.goto(`${URLS.dashboard}/login`);
    await page.getByPlaceholder('+996700000001').fill(SEED.resident.phone);
    await page.getByPlaceholder('••••••').fill(SEED.resident.password);
    await page.getByRole('button', { name: /sign in|войти/i }).click();
    // The dashboard's AuthProvider throws "Access denied. Admin only."
    await expect(page.getByText(/admin only/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
