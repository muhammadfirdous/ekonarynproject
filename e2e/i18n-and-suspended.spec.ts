import { test, expect, URLS, SEED } from './setup/fixtures';
import { reseed } from './setup/seed';

test.beforeAll(() => {
  reseed();
});

test('dashboard language toggle on /login persists across reload via the cookie', async ({
  page,
}) => {
  await page.goto(`${URLS.dashboard}/login`);
  // The login page renders the bilingual toggle near the top.
  // RU is the default — confirm the EN button switches and the cookie persists.
  await page.getByRole('button', { name: 'EN' }).click();

  // The form's "Sign in" text should appear in English now.
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

  // Reload — the cookie must keep us in English.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

  // Cookie sanity check.
  const cookies = await page.context().cookies();
  const langCookie = cookies.find((c) => c.name === 'lang' || c.name === 'ekonaryn_lang');
  expect(langCookie?.value).toBe('en');
});

test('website language toggle (Header) persists across reload via the cookie', async ({ page }) => {
  await page.goto(URLS.website);
  // The default is RU; switch to EN.
  await page.getByRole('button', { name: 'EN' }).first().click();
  // After switch, the nav home link should read "Home".
  await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible();

  await page.reload();
  await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible();
});

test('suspended worker cannot log in: API returns 403 with the suspension reason', async ({
  request,
  apiLogin,
}) => {
  // Suspend the active worker via admin endpoint, then attempt login.
  const adminToken = await apiLogin(SEED.admin);
  const suspended = await request
    .post(`${URLS.api}/users/by-phone/+996700000002/suspend`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { reason: 'Multiple no-shows' },
    })
    .catch(() => null);

  // The dashboard's suspend endpoint expects an :id, not phone. Resolve via /users.
  if (!suspended || !suspended.ok()) {
    const list = await request.get(`${URLS.api}/users?role=WORKER&limit=200`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = (await list.json()).data as Array<{ id: string; phone: string }>;
    const target = data.find((u) => u.phone === SEED.workerActive.phone)!;
    const r = await request.post(`${URLS.api}/users/${target.id}/suspend`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { reason: 'Multiple no-shows' },
    });
    expect(r.ok()).toBe(true);
  }

  // Now the suspended worker cannot log in.
  const blocked = await request.post(`${URLS.api}/auth/login`, {
    data: SEED.workerActive,
  });
  expect(blocked.status()).toBe(403);
  const body = await blocked.json();
  expect(body.error).toMatch(/suspend/i);
  expect(body.error).toMatch(/Multiple no-shows/);
});
