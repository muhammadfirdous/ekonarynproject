import bcrypt from 'bcryptjs';
import { prisma } from '@ekonaryn/db';
import { resetDb } from '../helpers';
import { loginAs } from '../auth';

beforeEach(async () => {
  await resetDb();
});

// PUT /users/:id is exposed to non-admins (you can edit yourself), so the
// allow-list of fields zod accepts is the second-most-important attack surface
// after authentication. Zod's default mode strips unknown keys; the route also
// hand-checks role/accountStatus. Verify both halves.
describe('Mass-assignment defense — PUT /users/:id from a resident', () => {
  test('Resident cannot escalate themselves to ADMIN (route 403s on `role` field)', async () => {
    const r = await loginAs('resident');
    const res = await r.agent.put(`/api/v1/users/${r.user.id}`).send({ role: 'ADMIN' });
    expect(res.status).toBe(403);

    // DB role is unchanged.
    const fresh = await prisma.user.findUnique({ where: { id: r.user.id } });
    expect(fresh?.role).toBe('RESIDENT');
  });

  test('Resident cannot change accountStatus (route 403s on `accountStatus` field)', async () => {
    const r = await loginAs('resident');
    const res = await r.agent
      .put(`/api/v1/users/${r.user.id}`)
      .send({ accountStatus: 'SUSPENDED' });
    expect(res.status).toBe(403);
  });

  test("Resident's `password` is stripped by zod (no plaintext password set via PUT)", async () => {
    const r = await loginAs('resident');
    const before = await prisma.user.findUnique({ where: { id: r.user.id } });
    const beforeHash = before!.password;

    const res = await r.agent
      .put(`/api/v1/users/${r.user.id}`)
      .send({ name: 'Changed', password: 'leet-pwned-password' });
    expect(res.status).toBe(200);

    const after = await prisma.user.findUnique({ where: { id: r.user.id } });
    // Password column unchanged.
    expect(after!.password).toBe(beforeHash);
    // Name DID update — proves the request reached the handler.
    expect(after!.name).toBe('Changed');
  });

  test("Resident's `points` field is stripped by zod (no self-boost)", async () => {
    const r = await loginAs('resident');
    const before = await prisma.user.findUnique({ where: { id: r.user.id } });

    const res = await r.agent
      .put(`/api/v1/users/${r.user.id}`)
      .send({ name: 'Same', points: 999_999 });
    expect(res.status).toBe(200);

    const after = await prisma.user.findUnique({ where: { id: r.user.id } });
    expect(after!.points).toBe(before!.points);
  });

  test('Resident cannot set worker-only fields (idNumber/onShift) on themselves', async () => {
    const r = await loginAs('resident');
    const res = await r.agent
      .put(`/api/v1/users/${r.user.id}`)
      .send({ name: 'Same Name', idNumber: 'AN9999999', onShift: true });
    // The schema accepts onShift but not idNumber. onShift on a resident is a
    // no-op semantically; idNumber is silently stripped.
    expect(res.status).toBe(200);
    const after = await prisma.user.findUnique({ where: { id: r.user.id } });
    expect(after!.idNumber).toBeNull();
  });
});

describe('Password hashing', () => {
  test('Newly registered resident has a bcrypt hash, never the plaintext', async () => {
    // Drive registration through the public endpoint (so we test the actual
    // hash-on-write path, not just a factory).
    const reqLib = (await import('supertest')).default;
    const app = (await import('../../src/app')).default;
    const phone = '+996700099001';
    const password = 'plaintext-secret';
    const res = await reqLib(app)
      .post('/api/v1/auth/register/resident')
      .send({ name: 'Alice Test', phone, password, address: '12 Lenin' });
    expect([200, 201]).toContain(res.status);

    const u = await prisma.user.findUnique({ where: { phone } });
    expect(u).not.toBeNull();
    expect(u!.password).not.toBe(password);
    // bcrypt hashes start with $2a$ / $2b$ / $2y$ and are at least 60 chars.
    expect(u!.password).toMatch(/^\$2[aby]\$/);
    expect(u!.password.length).toBeGreaterThanOrEqual(60);
    // The hash actually verifies the password.
    expect(await bcrypt.compare(password, u!.password)).toBe(true);
  });

  test('Login still works with the hashed-then-compared password', async () => {
    const reqLib = (await import('supertest')).default;
    const app = (await import('../../src/app')).default;
    const phone = '+996700099002';
    const password = 'roundtrip-pw-9';
    await reqLib(app)
      .post('/api/v1/auth/register/resident')
      .send({ name: 'Bob Test', phone, password, address: '12 Lenin' });

    const login = await reqLib(app).post('/api/v1/auth/login').send({ phone, password });
    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toBeDefined();
  });
});
