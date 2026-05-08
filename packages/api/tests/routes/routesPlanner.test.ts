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

describe('POST /api/v1/routes', () => {
  test('admin creates a route with stops; stops are JSON-stringified at rest, parsed on read', async () => {
    const { agent } = await loginAs('admin');
    const w = await factories.worker();
    const stops = [
      { address: 'Center 1', order: 1, notes: 'PET' },
      { address: 'Mikrorayon 5', order: 2 },
    ];
    const res = await agent.post('/api/v1/routes').send({
      workerId: w.id,
      date: new Date().toISOString(),
      stops,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.stops).toEqual(stops);

    const inDb = await prisma.route.findUnique({ where: { id: res.body.data.id } });
    expect(typeof inDb!.stops).toBe('string');
    expect(JSON.parse(inDb!.stops)).toEqual(stops);
  });

  test('worker → 403', async () => {
    const { agent } = await loginAs('worker');
    const res = await agent.post('/api/v1/routes').send({
      workerId: 'whatever',
      date: new Date().toISOString(),
      stops: [{ address: 'X', order: 1 }],
    });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/routes', () => {
  test('worker sees only own routes', async () => {
    const me = await loginAs('worker');
    const other = await factories.worker();
    await factories.route({ workerId: me.user.id, stops: [{ address: 'Mine', order: 1 }] });
    await factories.route({ workerId: other.id, stops: [{ address: 'Other', order: 1 }] });
    const res = await me.agent.get('/api/v1/routes');
    expect(res.body.data.every((r: { workerId: string }) => r.workerId === me.user.id)).toBe(true);
  });

  test('admin can pass ?workerId=...', async () => {
    const admin = await loginAs('admin');
    const w = await factories.worker();
    await factories.route({ workerId: w.id });
    await factories.route({ workerId: w.id });
    const res = await admin.agent.get(`/api/v1/routes?workerId=${w.id}`);
    expect(res.body.data.every((r: { workerId: string }) => r.workerId === w.id)).toBe(true);
  });

  test('?date= filter narrows to one day', async () => {
    const admin = await loginAs('admin');
    const w = await factories.worker();
    const today = new Date('2026-05-08T08:00:00.000Z');
    const yesterday = new Date('2026-05-07T08:00:00.000Z');
    await factories.route({ workerId: w.id, date: today });
    await factories.route({ workerId: w.id, date: yesterday });
    const res = await admin.agent.get(`/api/v1/routes?workerId=${w.id}&date=2026-05-08`);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('PUT /api/v1/routes/:id', () => {
  test('admin can update stops + status', async () => {
    const admin = await loginAs('admin');
    const w = await factories.worker();
    const r = await factories.route({ workerId: w.id });
    const res = await admin.agent.put(`/api/v1/routes/${r.id}`).send({
      stops: [{ address: 'New Place', order: 1 }],
      status: 'completed',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.stops).toEqual([{ address: 'New Place', order: 1 }]);
  });
});
