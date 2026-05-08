import { test, expect, URLS, SEED } from './setup/fixtures';
import { reseed } from './setup/seed';

// Worker approval lifecycle:
//   - Seed has one PENDING worker (+996700000005). Admin sees them on
//     /workers/pending, approves them, and from there they can sign in via
//     the API. The reject path uses a fresh worker that we register through
//     /auth/worker-register, then admin rejects with a reason and we verify
//     login is blocked with the appropriate error.

// Reseed before EVERY test in this file: the approve test promotes the seed
// pending worker to ACTIVE, so the reject test below would otherwise have no
// PENDING_APPROVAL row to act on.
test.beforeEach(() => {
  reseed();
});

async function adminLoginUI(page: import('@playwright/test').Page) {
  await page.goto(`${URLS.dashboard}/login`);
  await page.getByPlaceholder('+996700000001').fill(SEED.admin.phone);
  await page.getByPlaceholder('••••••').fill(SEED.admin.password);
  await page.getByRole('button', { name: /sign in|войти/i }).click();
  await expect.poll(async () => page.url(), { timeout: 10_000 }).toMatch(/\/$|\/\?/);
}

test('admin approves the pending worker; worker can then log in via API', async ({
  page,
  request,
  apiLogin,
}) => {
  await adminLoginUI(page);
  await page.goto(`${URLS.dashboard}/workers/pending`);

  // The pending seed worker is "Эмиль Дуйшеев" with phone +996700000005.
  await expect(page.getByText('Эмиль Дуйшеев')).toBeVisible({ timeout: 10_000 });

  const row = page.locator('div', { hasText: 'Эмиль Дуйшеев' }).first();
  await row.getByRole('button', { name: /approve|одобрить/i }).click();

  // Either the row leaves the queue or the API confirms ACTIVE — we poll the API.
  const adminToken = await apiLogin(SEED.admin);
  await expect
    .poll(
      async () => {
        const r = await request.get(
          `${URLS.api}/users?role=WORKER&accountStatus=ACTIVE&limit=200`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          },
        );
        const data = (await r.json()).data as Array<{ phone: string }>;
        return data.some((u) => u.phone === '+996700000005');
      },
      { timeout: 10_000 },
    )
    .toBe(true);

  // The newly approved worker can now log in via API.
  const workerLogin = await request.post(`${URLS.api}/auth/login`, {
    data: { phone: '+996700000005', password: 'worker123' },
  });
  expect(workerLogin.ok()).toBe(true);
});

test('admin rejects the pending worker with a reason; subsequent login is blocked with 403', async ({
  page,
  request,
  apiLogin,
}) => {
  // Use the seed PENDING_APPROVAL worker (+996700000005). The /register/worker
  // route requires a multipart upload for idDocument, which Playwright can do
  // but the fastest path is to drive the admin-side UI and check the API.
  await adminLoginUI(page);
  await page.goto(`${URLS.dashboard}/workers/pending`);
  await expect(page.getByText('Эмиль Дуйшеев')).toBeVisible({ timeout: 10_000 });

  // Hook into the prompt() the page uses to ask for a reason.
  page.once('dialog', (dialog) => dialog.accept('Insufficient documents'));
  const row = page.locator('div', { hasText: 'Эмиль Дуйшеев' }).first();
  await row.getByRole('button', { name: /reject|отклон/i }).click();

  // Confirm via API: account status is REJECTED.
  const adminToken = await apiLogin(SEED.admin);
  await expect
    .poll(
      async () => {
        const r = await request.get(`${URLS.api}/users?role=WORKER&limit=500`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const data = (await r.json()).data as Array<{ phone: string; accountStatus: string }>;
        const target = data.find((u) => u.phone === SEED.workerPending.phone);
        return target?.accountStatus ?? null;
      },
      { timeout: 10_000 },
    )
    .toBe('REJECTED');

  // Login is blocked with 403 + the rejection reason embedded in the message.
  const blocked = await request.post(`${URLS.api}/auth/login`, {
    data: SEED.workerPending,
  });
  expect(blocked.status()).toBe(403);
  const body = await blocked.json();
  expect(body.error).toMatch(/reject/i);
  expect(body.error).toMatch(/Insufficient documents/);
});
