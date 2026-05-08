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

describe('GET /api/v1/schedule (public)', () => {
  test('returns active rows ordered by dayOfWeek then time', async () => {
    await factories.schedule({ area: 'Center', dayOfWeek: 4, time: '14:00' });
    await factories.schedule({ area: 'Mikro', dayOfWeek: 1, time: '09:00' });
    await factories.schedule({ area: 'Mikro', dayOfWeek: 1, time: '15:00' });
    // Inactive should be hidden.
    await factories.schedule({ area: 'Hidden', dayOfWeek: 0, time: '08:00', active: false });

    const res = await request(app).get('/api/v1/schedule');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    // Sorted by (dayOfWeek asc, time asc).
    const order = res.body.data.map(
      (r: { dayOfWeek: number; time: string }) => `${r.dayOfWeek}-${r.time}`,
    );
    expect(order).toEqual(['1-09:00', '1-15:00', '4-14:00']);
  });
});

describe('POST /api/v1/schedule (admin)', () => {
  test('happy path', async () => {
    const { agent } = await loginAs('admin');
    const res = await agent.post('/api/v1/schedule').send({
      area: 'Ak-Zhol',
      dayOfWeek: 3,
      time: '09:30',
      active: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.area).toBe('Ak-Zhol');
  });

  test('dayOfWeek 7 → 400 (must be 0..6)', async () => {
    const { agent } = await loginAs('admin');
    const res = await agent.post('/api/v1/schedule').send({
      area: 'X',
      dayOfWeek: 7,
      time: '09:00',
    });
    expect(res.status).toBe(400);
  });

  test('time format HH:MM is enforced', async () => {
    const { agent } = await loginAs('admin');
    const res = await agent.post('/api/v1/schedule').send({
      area: 'X',
      dayOfWeek: 1,
      time: '9:00',
    });
    expect(res.status).toBe(400);
  });

  test('non-admin → 403', async () => {
    const { agent } = await loginAs('worker');
    const res = await agent.post('/api/v1/schedule').send({
      area: 'X',
      dayOfWeek: 1,
      time: '09:00',
    });
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/v1/schedule/:id', () => {
  test('admin can flip active', async () => {
    const { agent } = await loginAs('admin');
    const s = await factories.schedule({ active: true });
    const res = await agent.put(`/api/v1/schedule/${s.id}`).send({ active: false });
    expect(res.status).toBe(200);
    expect(res.body.data.active).toBe(false);
  });
});
