import { prisma } from '@ekonaryn/db';
import { OrderStatus } from '@ekonaryn/shared';
import { factories } from '../factories';
import { loginAs } from '../auth';
import { resetDb } from '../helpers';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/v1/trips', () => {
  test('admin creates trip; trip is owned by the admin (workerId field)', async () => {
    const { agent, user } = await loginAs('admin');
    const res = await agent
      .post('/api/v1/trips')
      .send({ date: new Date().toISOString(), destination: 'Bishkek', revenue: 12_000 });
    expect(res.status).toBe(201);
    expect(res.body.data.workerId).toBe(user.id);
    expect(res.body.data.destination).toBe('Bishkek');
  });

  test('worker can create their own trip', async () => {
    const { agent, user } = await loginAs('worker');
    const res = await agent.post('/api/v1/trips').send({ date: new Date().toISOString() });
    expect(res.status).toBe(201);
    expect(res.body.data.workerId).toBe(user.id);
  });

  test('resident → 403', async () => {
    const { agent } = await loginAs('resident');
    const res = await agent.post('/api/v1/trips').send({ date: new Date().toISOString() });
    expect(res.status).toBe(403);
  });

  test('linking collectionIds attaches them to the trip', async () => {
    const admin = await loginAs('admin');
    const r = await factories.resident({ address: 'Center 5' });
    const m = await factories.material();
    const w = await factories.worker({ serviceAreas: ['Center'] });
    const pr1 = await factories.pickupRequest({
      residentId: r.id,
      materialId: m.id,
      address: 'Center 5',
      status: OrderStatus.ASSIGNED,
      assignedWorkerId: w.id,
    });
    const pr2 = await factories.pickupRequest({
      residentId: r.id,
      materialId: m.id,
      address: 'Center 5',
      status: OrderStatus.ASSIGNED,
      assignedWorkerId: w.id,
    });
    const c1 = await factories.collection({
      workerId: w.id,
      requestId: pr1.id,
      materialId: m.id,
      actualWeightKg: 4,
    });
    const c2 = await factories.collection({
      workerId: w.id,
      requestId: pr2.id,
      materialId: m.id,
      actualWeightKg: 6,
    });

    const res = await admin.agent.post('/api/v1/trips').send({
      date: new Date().toISOString(),
      collectionIds: [c1.id, c2.id],
    });
    expect(res.status).toBe(201);

    const linked = await prisma.collection.findMany({ where: { tripId: res.body.data.id } });
    expect(linked).toHaveLength(2);
  });
});

describe('GET /api/v1/trips & PUT /api/v1/trips/:id', () => {
  test('list returns rows; single get returns one; PUT updates', async () => {
    const { agent, user } = await loginAs('admin');
    const t = await factories.trip({ workerId: user.id, totalWeightKg: 100, revenue: 5000 });
    const list = await agent.get('/api/v1/trips');
    expect(list.body.data.find((x: { id: string }) => x.id === t.id)).toBeDefined();

    const one = await agent.get(`/api/v1/trips/${t.id}`);
    expect(one.body.data.id).toBe(t.id);

    const upd = await agent
      .put(`/api/v1/trips/${t.id}`)
      .send({ revenue: 7500, transportCost: 1200 });
    expect(upd.body.data.revenue).toBe(7500);
    expect(upd.body.data.transportCost).toBe(1200);
  });

  test('GET /:id 404 when missing', async () => {
    const { agent } = await loginAs('admin');
    const res = await agent.get('/api/v1/trips/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
