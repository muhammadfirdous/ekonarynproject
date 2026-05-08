import { OrderStatus } from '@ekonaryn/shared';
import { factories } from '../factories';
import { loginAs } from '../auth';
import { resetDb } from '../helpers';
import { prisma } from '@ekonaryn/db';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function seedDeterministic() {
  const admin = await loginAs('admin');
  const m1 = await factories.material({ name: 'PET', sellingPrice: 10 });
  const m2 = await factories.material({
    name: 'Cardboard',
    nameKy: 'Картон',
    nameRu: 'Картон',
    sellingPrice: 5,
  });
  const r1 = await factories.resident();
  const r2 = await factories.resident();
  const w1 = await factories.worker({ serviceAreas: ['Center'] });
  const w2 = await factories.worker({ serviceAreas: ['Center'] });

  // Two completed requests for w1 with PET; one completed for w2 with Cardboard.
  const pr1 = await factories.pickupRequest({
    residentId: r1.id,
    materialId: m1.id,
    status: OrderStatus.COMPLETED,
    assignedWorkerId: w1.id,
  });
  const pr2 = await factories.pickupRequest({
    residentId: r2.id,
    materialId: m1.id,
    status: OrderStatus.COMPLETED,
    assignedWorkerId: w1.id,
  });
  const pr3 = await factories.pickupRequest({
    residentId: r1.id,
    materialId: m2.id,
    status: OrderStatus.COMPLETED,
    assignedWorkerId: w2.id,
  });

  await factories.collection({
    workerId: w1.id,
    requestId: pr1.id,
    materialId: m1.id,
    actualWeightKg: 10,
  });
  await factories.collection({
    workerId: w1.id,
    requestId: pr2.id,
    materialId: m1.id,
    actualWeightKg: 5,
  });
  await factories.collection({
    workerId: w2.id,
    requestId: pr3.id,
    materialId: m2.id,
    actualWeightKg: 8,
  });

  // One trip for w1 with revenue.
  await factories.trip({ workerId: w1.id, totalWeightKg: 15, revenue: 200, transportCost: 50 });

  // One pending request for the overview's pendingRequests counter.
  await factories.pickupRequest({
    residentId: r2.id,
    materialId: m1.id,
    status: OrderStatus.PENDING,
  });

  return { admin, m1, m2, w1, w2, r1, r2 };
}

describe('GET /api/v1/analytics/overview', () => {
  test('returns the full overview from a known seed', async () => {
    const { admin } = await seedDeterministic();
    const res = await admin.agent.get('/api/v1/analytics/overview');
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.totalCollections).toBe(3);
    expect(d.totalWeightKg).toBe(23);
    expect(d.totalRevenue).toBe(200);
    expect(d.activeWorkers).toBe(2);
    expect(d.totalResidents).toBe(2);
  });

  test('pendingRequests equals the number of lowercase "pending" requests', async () => {
    const { admin } = await seedDeterministic();
    const res = await admin.agent.get('/api/v1/analytics/overview');
    expect(res.body.data.pendingRequests).toBe(1);
  });

  test('non-admin → 403', async () => {
    const { agent } = await loginAs('worker');
    const res = await agent.get('/api/v1/analytics/overview');
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/analytics/monthly', () => {
  test('aggregates per-month with the right keys', async () => {
    const { admin, m1, w1, r1 } = await seedDeterministic();
    // Override one collection's collectedAt to a known month.
    const collections = await prisma.collection.findMany();
    const target = collections[0];
    await prisma.collection.update({
      where: { id: target.id },
      data: { collectedAt: new Date('2026-04-15T00:00:00.000Z') },
    });

    const res = await admin.agent.get('/api/v1/analytics/monthly');
    const months = Object.keys(res.body.data);
    expect(months).toContain('2026-04');
    const apr = res.body.data['2026-04'];
    expect(apr.collections).toBe(1);
    expect(apr.weightKg).toBe(target.actualWeightKg);
    expect(apr.value).toBe(target.actualWeightKg * 10); // m1 sellingPrice = 10
  });
});

describe('GET /api/v1/analytics/materials', () => {
  test('groups by material with correct totals', async () => {
    const { admin, m1, m2 } = await seedDeterministic();
    const res = await admin.agent.get('/api/v1/analytics/materials');
    expect(res.status).toBe(200);
    const byId = Object.fromEntries(
      res.body.data.map(
        (d: {
          material: { id: string };
          totalWeightKg: number;
          totalCollections: number;
          estimatedValue: number;
        }) => [d.material.id, d],
      ),
    );
    expect(byId[m1.id].totalWeightKg).toBe(15); // 10+5
    expect(byId[m1.id].totalCollections).toBe(2);
    expect(byId[m1.id].estimatedValue).toBe(150); // 15 * 10
    expect(byId[m2.id].totalWeightKg).toBe(8);
    expect(byId[m2.id].estimatedValue).toBe(40); // 8 * 5
  });
});

describe('GET /api/v1/analytics/workers', () => {
  test('per-worker totals (collections, weight, trips)', async () => {
    const { admin, w1, w2 } = await seedDeterministic();
    const res = await admin.agent.get('/api/v1/analytics/workers');
    expect(res.status).toBe(200);
    const byId = Object.fromEntries(
      res.body.data.map(
        (s: {
          worker: { id: string };
          totalCollections: number;
          totalWeightKg: number;
          totalTrips: number;
        }) => [s.worker.id, s],
      ),
    );
    expect(byId[w1.id].totalCollections).toBe(2);
    expect(byId[w1.id].totalWeightKg).toBe(15);
    expect(byId[w1.id].totalTrips).toBe(1);
    expect(byId[w2.id].totalCollections).toBe(1);
    expect(byId[w2.id].totalWeightKg).toBe(8);
    expect(byId[w2.id].totalTrips).toBe(0);
  });
});
