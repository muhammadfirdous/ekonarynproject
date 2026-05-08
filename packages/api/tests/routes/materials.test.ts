import request from 'supertest';
import app from '../../src/app';
import { prisma } from '@ekonaryn/db';
import { factories } from '../factories';
import { loginAs } from '../auth';
import { resetDb } from '../helpers';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/v1/materials (public)', () => {
  test('returns rows alphabetically by name', async () => {
    await factories.material({ name: 'Cardboard', nameKy: 'Картон', nameRu: 'Картон' });
    await factories.material({ name: 'Aluminum', nameKy: 'Алюминий', nameRu: 'Алюминий' });
    const res = await request(app).get('/api/v1/materials');
    expect(res.status).toBe(200);
    const names = res.body.data.map((m: { name: string }) => m.name);
    expect(names).toEqual([...names].sort());
  });
});

describe('POST /api/v1/materials (admin)', () => {
  test('happy path', async () => {
    const { agent } = await loginAs('admin');
    const res = await agent.post('/api/v1/materials').send({
      name: 'Glass',
      nameKy: 'Айнек',
      nameRu: 'Стекло',
      buyingPrice: 2,
      sellingPrice: 5,
      unit: 'kg',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Glass');
  });

  test('non-admin → 403', async () => {
    const { agent } = await loginAs('resident');
    const res = await agent.post('/api/v1/materials').send({
      name: 'Glass',
      nameKy: 'X',
      nameRu: 'X',
      buyingPrice: 1,
      sellingPrice: 2,
    });
    expect(res.status).toBe(403);
  });

  test('non-positive price → 400', async () => {
    const { agent } = await loginAs('admin');
    const res = await agent.post('/api/v1/materials').send({
      name: 'Bad',
      nameKy: 'X',
      nameRu: 'X',
      buyingPrice: 0,
      sellingPrice: 0,
    });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/v1/materials/:id (admin)', () => {
  test('updates fields', async () => {
    const { agent } = await loginAs('admin');
    const m = await factories.material({ buyingPrice: 5 });
    const res = await agent.put(`/api/v1/materials/${m.id}`).send({
      name: m.name,
      nameKy: m.nameKy,
      nameRu: m.nameRu,
      buyingPrice: 10,
      sellingPrice: 20,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.buyingPrice).toBe(10);
  });
});

describe('DELETE /api/v1/materials/:id (admin)', () => {
  test('hard-deletes a material with no references', async () => {
    const { agent } = await loginAs('admin');
    const m = await factories.material();
    const res = await agent.delete(`/api/v1/materials/${m.id}`);
    expect(res.status).toBe(200);
    expect(await prisma.material.findUnique({ where: { id: m.id } })).toBeNull();
  });

  // Documents current FK behavior: deleting a referenced material errors out
  // (Prisma raises P2003), which the generic error handler maps to 500.
  // If a future PR maps P2003 → 409, swap this to .failing.
  test('referenced material cannot be deleted (Prisma FK error → 500)', async () => {
    const { agent } = await loginAs('admin');
    const r = await factories.resident();
    const m = await factories.material();
    await factories.pickupRequest({ residentId: r.id, materialId: m.id });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await agent.delete(`/api/v1/materials/${m.id}`);
    spy.mockRestore();
    expect(res.status).toBe(500);
    expect(await prisma.material.findUnique({ where: { id: m.id } })).not.toBeNull();
  });
});
