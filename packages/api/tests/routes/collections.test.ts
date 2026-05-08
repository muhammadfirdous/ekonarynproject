import path from 'path';
import fs from 'fs';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '@ekonaryn/db';
import { OrderStatus, ActivityAction } from '@ekonaryn/shared';
import { factories } from '../factories';
import { loginAs } from '../auth';
import { resetDb } from '../helpers';

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
const PNG_PATH = path.resolve(FIXTURES_DIR, 'tiny.png');

beforeAll(() => {
  if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  if (!fs.existsSync(PNG_PATH)) {
    fs.writeFileSync(
      PNG_PATH,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9ZGv9YgAAAAASUVORK5CYII=',
        'base64',
      ),
    );
  }
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function setupAssignedRequest() {
  const me = await loginAs('worker', { serviceAreas: ['Center'] });
  const r = await factories.resident({ address: 'Center 5' });
  const m = await factories.material();
  const pr = await factories.pickupRequest({
    residentId: r.id,
    materialId: m.id,
    address: 'Center 5',
    status: OrderStatus.ASSIGNED,
    assignedWorkerId: me.user.id,
  });
  return { worker: me, resident: r, material: m, pickupRequest: pr };
}

describe('POST /api/v1/collections', () => {
  test('worker logs collection on assigned request → request becomes completed and resident gets points', async () => {
    const ctx = await setupAssignedRequest();
    const res = await ctx.worker.agent
      .post('/api/v1/collections')
      .field('requestId', ctx.pickupRequest.id)
      .field('materialId', ctx.material.id)
      .field('actualWeightKg', '7.5');
    expect(res.status).toBe(201);
    expect(res.body.data.workerId).toBe(ctx.worker.user.id);

    const updatedRequest = await prisma.pickupRequest.findUnique({
      where: { id: ctx.pickupRequest.id },
    });
    expect(updatedRequest!.status).toBe(OrderStatus.COMPLETED);

    const resident = await prisma.user.findUnique({ where: { id: ctx.resident.id } });
    expect(resident!.points).toBe(7); // floor(7.5)

    const log = await prisma.activityLog.findFirst({
      where: {
        action: ActivityAction.ORDER_STATUS_CHANGED,
        entityId: ctx.pickupRequest.id,
      },
    });
    expect(log).not.toBeNull();
  });

  test('photo upload: multipart with png is accepted and photoUrl is recorded', async () => {
    const ctx = await setupAssignedRequest();
    const res = await ctx.worker.agent
      .post('/api/v1/collections')
      .field('requestId', ctx.pickupRequest.id)
      .field('materialId', ctx.material.id)
      .field('actualWeightKg', '5.0')
      .attach('photo', PNG_PATH);
    expect(res.status).toBe(201);
    expect(res.body.data.photoUrl).toMatch(/^\/uploads\//);

    // Clean up the uploaded file.
    const uploaded = path.resolve(
      __dirname,
      '../../uploads',
      path.basename(res.body.data.photoUrl),
    );
    if (fs.existsSync(uploaded)) fs.unlinkSync(uploaded);
  });

  test("worker cannot collect another worker's request → 403", async () => {
    const m = await factories.material();
    const r = await factories.resident({ address: 'Center 5' });
    const me = await loginAs('worker', { serviceAreas: ['Center'] });
    const other = await factories.worker({ serviceAreas: ['Center'] });
    const pr = await factories.pickupRequest({
      residentId: r.id,
      materialId: m.id,
      address: 'Center 5',
      status: OrderStatus.ASSIGNED,
      assignedWorkerId: other.id,
    });

    const res = await me.agent
      .post('/api/v1/collections')
      .field('requestId', pr.id)
      .field('materialId', m.id)
      .field('actualWeightKg', '5');
    expect(res.status).toBe(403);
  });

  test("admin can collect on a worker's behalf", async () => {
    const m = await factories.material();
    const r = await factories.resident({ address: 'Center 5' });
    const w = await factories.worker({ serviceAreas: ['Center'] });
    const admin = await loginAs('admin');
    const pr = await factories.pickupRequest({
      residentId: r.id,
      materialId: m.id,
      address: 'Center 5',
      status: OrderStatus.ASSIGNED,
      assignedWorkerId: w.id,
    });

    const res = await admin.agent
      .post('/api/v1/collections')
      .field('requestId', pr.id)
      .field('materialId', m.id)
      .field('actualWeightKg', '4');
    expect(res.status).toBe(201);
    expect(res.body.data.workerId).toBe(admin.user.id); // recorded as the admin
  });

  test('cannot collect on a request not in assigned/in_progress → 409', async () => {
    const me = await loginAs('worker', { serviceAreas: ['Center'] });
    const r = await factories.resident({ address: 'Center 5' });
    const m = await factories.material();
    const pr = await factories.pickupRequest({
      residentId: r.id,
      materialId: m.id,
      address: 'Center 5',
      status: OrderStatus.PENDING,
      assignedWorkerId: me.user.id,
    });

    const res = await me.agent
      .post('/api/v1/collections')
      .field('requestId', pr.id)
      .field('materialId', m.id)
      .field('actualWeightKg', '5');
    expect(res.status).toBe(409);
    // No collection row should have been created.
    const count = await prisma.collection.count();
    expect(count).toBe(0);
  });

  test('atomicity: when transition fails, no Collection row is created', async () => {
    // Use a terminal-state request so transition will fail.
    const me = await loginAs('worker', { serviceAreas: ['Center'] });
    const r = await factories.resident({ address: 'Center 5' });
    const m = await factories.material();
    const pr = await factories.pickupRequest({
      residentId: r.id,
      materialId: m.id,
      address: 'Center 5',
      status: OrderStatus.COMPLETED,
      assignedWorkerId: me.user.id,
    });

    const before = await prisma.collection.count();
    const res = await me.agent
      .post('/api/v1/collections')
      .field('requestId', pr.id)
      .field('materialId', m.id)
      .field('actualWeightKg', '5');
    expect(res.status).toBeGreaterThanOrEqual(400);
    const after = await prisma.collection.count();
    expect(after).toBe(before);
  });

  test('inactive worker is blocked by requireActiveAccount → 403', async () => {
    const ctx = await setupAssignedRequest();
    await prisma.user.update({
      where: { id: ctx.worker.user.id },
      data: { accountStatus: 'SUSPENDED' },
    });
    const res = await ctx.worker.agent
      .post('/api/v1/collections')
      .field('requestId', ctx.pickupRequest.id)
      .field('materialId', ctx.material.id)
      .field('actualWeightKg', '5');
    expect(res.status).toBe(403);
  });

  test('resident cannot create a collection → 403', async () => {
    const me = await loginAs('resident');
    const w = await factories.worker({ serviceAreas: ['Center'] });
    const m = await factories.material();
    const pr = await factories.pickupRequest({
      residentId: me.user.id,
      materialId: m.id,
      address: 'Center 5',
      status: OrderStatus.ASSIGNED,
      assignedWorkerId: w.id,
    });
    const res = await me.agent
      .post('/api/v1/collections')
      .field('requestId', pr.id)
      .field('materialId', m.id)
      .field('actualWeightKg', '5');
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/collections', () => {
  test('admin sees all', async () => {
    const ctx = await setupAssignedRequest();
    await ctx.worker.agent
      .post('/api/v1/collections')
      .field('requestId', ctx.pickupRequest.id)
      .field('materialId', ctx.material.id)
      .field('actualWeightKg', '6');

    const admin = await loginAs('admin');
    const res = await admin.agent.get('/api/v1/collections');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  test('worker sees only own', async () => {
    const ctx = await setupAssignedRequest();
    await ctx.worker.agent
      .post('/api/v1/collections')
      .field('requestId', ctx.pickupRequest.id)
      .field('materialId', ctx.material.id)
      .field('actualWeightKg', '6');

    // Another worker with their own collection — should NOT be visible to ctx.worker.
    const other = await loginAs('worker', { serviceAreas: ['Center'] });
    const r2 = await factories.resident({ address: 'Center 7' });
    const m2 = await factories.material({ name: 'Cardboard', nameKy: 'Картон', nameRu: 'Картон' });
    const pr2 = await factories.pickupRequest({
      residentId: r2.id,
      materialId: m2.id,
      address: 'Center 7',
      status: OrderStatus.ASSIGNED,
      assignedWorkerId: other.user.id,
    });
    await other.agent
      .post('/api/v1/collections')
      .field('requestId', pr2.id)
      .field('materialId', m2.id)
      .field('actualWeightKg', '4');

    const res = await ctx.worker.agent.get('/api/v1/collections');
    expect(
      res.body.data.every((c: { workerId: string }) => c.workerId === ctx.worker.user.id),
    ).toBe(true);
  });
});

describe('PUT /api/v1/collections/:id', () => {
  test("worker can update own; cannot update another worker's", async () => {
    const ctx = await setupAssignedRequest();
    const created = await ctx.worker.agent
      .post('/api/v1/collections')
      .field('requestId', ctx.pickupRequest.id)
      .field('materialId', ctx.material.id)
      .field('actualWeightKg', '6');
    const id = created.body.data.id;

    // Self-update.
    const ok = await ctx.worker.agent
      .put(`/api/v1/collections/${id}`)
      .send({ notes: 'good condition' });
    expect(ok.status).toBe(200);

    // Other worker.
    const other = await loginAs('worker', { serviceAreas: ['Center'] });
    const blocked = await other.agent.put(`/api/v1/collections/${id}`).send({ notes: 'sneaky' });
    expect(blocked.status).toBe(403);
  });
});
