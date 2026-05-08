import { prisma } from '@ekonaryn/db';
import { resetDb } from '../helpers';
import { loginAs } from '../auth';
import { factories } from '../factories';

beforeEach(async () => {
  await resetDb();
});

// Prisma is parameterized, so SQL fragments in user input should be stored as
// literal strings rather than executed. NoSQL-style operator injection (`$ne`,
// `$gt`, etc.) should be rejected by zod validation, not silently coerced.
describe('Injection guard — Prisma is parameterized', () => {
  test('SQL-shaped name is stored as a literal string, not executed', async () => {
    const admin = await loginAs('admin');
    const evil = "'; DROP TABLE User; --";

    // Try via /users/:id PUT (admin path that allows name change).
    const target = await factories.resident();
    const res = await admin.agent.put(`/api/v1/users/${target.id}`).send({ name: evil });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(evil);

    // The User table is still alive — count should still resolve.
    const stillThere = await prisma.user.count();
    expect(stillThere).toBeGreaterThan(0);
  });

  test('SQL-shaped address in a pickup request is stored as a literal string', async () => {
    const resident = await loginAs('resident');
    const mat = await factories.material();
    const evil = "'; DELETE FROM PickupRequest; --";
    const res = await resident.agent.post('/api/v1/requests').send({
      materialId: mat.id,
      address: evil,
      estimatedQty: 1,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.address).toBe(evil);

    // No request was deleted by the literal — the row exists.
    const reqs = await prisma.pickupRequest.findMany({ where: { address: evil } });
    expect(reqs.length).toBe(1);
  });

  test('Notes containing HTML/script tags are stored verbatim (no eval)', async () => {
    const resident = await loginAs('resident');
    const mat = await factories.material();
    const xss = '<script>alert("pwned")</script>';
    const res = await resident.agent.post('/api/v1/requests').send({
      materialId: mat.id,
      address: '12 Lenin',
      estimatedQty: 1,
      notes: xss,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.notes).toBe(xss);
    // Storage layer is escape-agnostic; rendering at the UI is responsible for
    // escaping. We just verify nothing here is executing the script.
  });
});

describe('Injection guard — NoSQL operator injection is rejected by zod', () => {
  test('phone field rejects {$ne: null} on /auth/login', async () => {
    const reqLib = (await import('supertest')).default;
    const app = (await import('../../src/app')).default;
    const res = await reqLib(app)
      .post('/api/v1/auth/login')
      .send({ phone: { $ne: null }, password: { $ne: null } } as unknown);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Object payload where a string is required → 400 from zod', async () => {
    const resident = await loginAs('resident');
    const mat = await factories.material();
    const res = await resident.agent.post('/api/v1/requests').send({
      materialId: mat.id,
      address: { $eq: '12 Lenin' },
      estimatedQty: 1,
    });
    expect(res.status).toBe(400);
  });

  test('Operator-style estimatedQty (object instead of number) → 400', async () => {
    const resident = await loginAs('resident');
    const mat = await factories.material();
    const res = await resident.agent.post('/api/v1/requests').send({
      materialId: mat.id,
      address: '12 Lenin',
      estimatedQty: { $gt: 0 },
    });
    expect(res.status).toBe(400);
  });
});
