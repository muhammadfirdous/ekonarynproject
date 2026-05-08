import request from 'supertest';
import app from '../../src/app';
import { prisma } from '@ekonaryn/db';
import { ActivityAction, OrderStatus } from '@ekonaryn/shared';
import { factories } from '../factories';
import { loginAs } from '../auth';
import { resetDb } from '../helpers';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function setupAdminAndMaterial() {
  const admin = await loginAs('admin');
  const material = await factories.material();
  return { admin, material };
}

describe('POST /api/v1/requests', () => {
  test('happy path: resident creates pending request and request.created is logged', async () => {
    const { user, agent } = await loginAs('resident');
    const m = await factories.material();
    const res = await agent.post('/api/v1/requests').send({
      materialId: m.id,
      address: 'Center 9',
      estimatedQty: 8,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe(OrderStatus.PENDING);
    expect(res.body.data.residentId).toBe(user.id);
    const log = await prisma.activityLog.findFirst({
      where: { action: ActivityAction.REQUEST_CREATED, entityId: res.body.data.id },
    });
    expect(log).not.toBeNull();
  });

  test('non-resident → 403', async () => {
    const { agent } = await loginAs('worker');
    const m = await factories.material();
    const res = await agent.post('/api/v1/requests').send({
      materialId: m.id,
      address: 'Center 9',
      estimatedQty: 8,
    });
    expect(res.status).toBe(403);
  });

  test('admin → 403 (admin is not a resident)', async () => {
    const { agent } = await loginAs('admin');
    const m = await factories.material();
    const res = await agent.post('/api/v1/requests').send({
      materialId: m.id,
      address: 'Center 9',
      estimatedQty: 8,
    });
    expect(res.status).toBe(403);
  });

  test('missing materialId → 400', async () => {
    const { agent } = await loginAs('resident');
    const res = await agent.post('/api/v1/requests').send({
      address: 'Center 9',
      estimatedQty: 8,
    });
    expect(res.status).toBe(400);
  });

  test('estimatedQty must be positive', async () => {
    const { agent } = await loginAs('resident');
    const m = await factories.material();
    const res = await agent.post('/api/v1/requests').send({
      materialId: m.id,
      address: 'Center 9',
      estimatedQty: 0,
    });
    expect(res.status).toBe(400);
  });

  test('unauth → 401', async () => {
    const m = await factories.material();
    const res = await request(app).post('/api/v1/requests').send({
      materialId: m.id,
      address: 'Center 9',
      estimatedQty: 8,
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/requests visibility', () => {
  test('admin sees all', async () => {
    const { admin, material } = await setupAdminAndMaterial();
    const r1 = await factories.resident();
    const r2 = await factories.resident();
    await factories.pickupRequest({ residentId: r1.id, materialId: material.id });
    await factories.pickupRequest({ residentId: r2.id, materialId: material.id });
    const res = await admin.agent.get('/api/v1/requests');
    expect(res.body.data.length).toBe(2);
  });

  test('resident sees only own', async () => {
    const m = await factories.material();
    const me = await loginAs('resident');
    const other = await factories.resident();
    await factories.pickupRequest({ residentId: me.user.id, materialId: m.id });
    await factories.pickupRequest({ residentId: other.id, materialId: m.id });
    const res = await me.agent.get('/api/v1/requests');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].residentId).toBe(me.user.id);
  });

  test('worker sees only assigned-to-self', async () => {
    const m = await factories.material();
    const r = await factories.resident();
    const me = await loginAs('worker');
    const other = await factories.worker();
    await factories.pickupRequest({
      residentId: r.id,
      materialId: m.id,
      status: OrderStatus.ASSIGNED,
      assignedWorkerId: me.user.id,
    });
    await factories.pickupRequest({
      residentId: r.id,
      materialId: m.id,
      status: OrderStatus.ASSIGNED,
      assignedWorkerId: other.id,
    });
    const res = await me.agent.get('/api/v1/requests');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].assignedWorkerId).toBe(me.user.id);
  });

  test('?status= filter applies', async () => {
    const { admin, material } = await setupAdminAndMaterial();
    const r = await factories.resident();
    await factories.pickupRequest({
      residentId: r.id,
      materialId: material.id,
      status: OrderStatus.PENDING,
    });
    await factories.pickupRequest({
      residentId: r.id,
      materialId: material.id,
      status: OrderStatus.COMPLETED,
    });
    const res = await admin.agent.get('/api/v1/requests?status=completed');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('completed');
  });
});

describe('GET /api/v1/requests/:id', () => {
  test('admin gets any', async () => {
    const { admin, material } = await setupAdminAndMaterial();
    const r = await factories.resident();
    const pr = await factories.pickupRequest({ residentId: r.id, materialId: material.id });
    const res = await admin.agent.get(`/api/v1/requests/${pr.id}`);
    expect(res.status).toBe(200);
  });

  test('resident gets own', async () => {
    const m = await factories.material();
    const me = await loginAs('resident');
    const pr = await factories.pickupRequest({ residentId: me.user.id, materialId: m.id });
    const res = await me.agent.get(`/api/v1/requests/${pr.id}`);
    expect(res.status).toBe(200);
  });

  test('resident reading another resident → 403', async () => {
    const m = await factories.material();
    const me = await loginAs('resident');
    const other = await factories.resident();
    const pr = await factories.pickupRequest({ residentId: other.id, materialId: m.id });
    const res = await me.agent.get(`/api/v1/requests/${pr.id}`);
    expect(res.status).toBe(403);
  });

  test('worker reading a request not assigned to them → 403', async () => {
    const m = await factories.material();
    const me = await loginAs('worker');
    const r = await factories.resident();
    const pr = await factories.pickupRequest({ residentId: r.id, materialId: m.id });
    const res = await me.agent.get(`/api/v1/requests/${pr.id}`);
    expect(res.status).toBe(403);
  });

  test('404 when missing or soft-deleted', async () => {
    const { admin, material } = await setupAdminAndMaterial();
    const res404 = await admin.agent.get('/api/v1/requests/00000000-0000-0000-0000-000000000000');
    expect(res404.status).toBe(404);

    const r = await factories.resident();
    const pr = await factories.pickupRequest({ residentId: r.id, materialId: material.id });
    await prisma.pickupRequest.update({ where: { id: pr.id }, data: { deletedAt: new Date() } });
    const resDel = await admin.agent.get(`/api/v1/requests/${pr.id}`);
    expect(resDel.status).toBe(404);
  });
});

describe('PUT /api/v1/requests/:id/status', () => {
  test('admin: legal pending → accepted', async () => {
    const { admin, material } = await setupAdminAndMaterial();
    const r = await factories.resident();
    const pr = await factories.pickupRequest({ residentId: r.id, materialId: material.id });
    const res = await admin.agent
      .put(`/api/v1/requests/${pr.id}/status`)
      .send({ status: 'accepted' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('accepted');
  });

  test('illegal jump pending → completed → 409', async () => {
    const { admin, material } = await setupAdminAndMaterial();
    const r = await factories.resident();
    const pr = await factories.pickupRequest({ residentId: r.id, materialId: material.id });
    const res = await admin.agent
      .put(`/api/v1/requests/${pr.id}/status`)
      .send({ status: 'completed' });
    expect(res.status).toBe(409);
  });

  test('terminal state stores reason on cancellation', async () => {
    const { admin, material } = await setupAdminAndMaterial();
    const r = await factories.resident();
    const pr = await factories.pickupRequest({ residentId: r.id, materialId: material.id });
    const res = await admin.agent
      .put(`/api/v1/requests/${pr.id}/status`)
      .send({ status: 'cancelled', reason: 'Resident moved out' });
    expect(res.status).toBe(200);
    const inDb = await prisma.pickupRequest.findUnique({ where: { id: pr.id } });
    expect(inDb!.cancellationReason).toBe('Resident moved out');
  });

  test('worker can transition only their own request', async () => {
    const m = await factories.material();
    const r = await factories.resident();
    const me = await loginAs('worker');
    const other = await factories.worker();
    const pr = await factories.pickupRequest({
      residentId: r.id,
      materialId: m.id,
      status: OrderStatus.ASSIGNED,
      assignedWorkerId: other.id,
    });
    const res = await me.agent
      .put(`/api/v1/requests/${pr.id}/status`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(403);
  });

  test('writes order.status_changed audit log', async () => {
    const { admin, material } = await setupAdminAndMaterial();
    const r = await factories.resident();
    const pr = await factories.pickupRequest({ residentId: r.id, materialId: material.id });
    await admin.agent.put(`/api/v1/requests/${pr.id}/status`).send({ status: 'accepted' });
    const log = await prisma.activityLog.findFirst({
      where: { action: ActivityAction.ORDER_STATUS_CHANGED, entityId: pr.id },
    });
    expect(log).not.toBeNull();
  });

  test('cancellation writes request.cancelled', async () => {
    const { admin, material } = await setupAdminAndMaterial();
    const r = await factories.resident();
    const pr = await factories.pickupRequest({ residentId: r.id, materialId: material.id });
    await admin.agent
      .put(`/api/v1/requests/${pr.id}/status`)
      .send({ status: 'cancelled', reason: 'duplicate' });
    const log = await prisma.activityLog.findFirst({
      where: { action: ActivityAction.REQUEST_CANCELLED, entityId: pr.id },
    });
    expect(log).not.toBeNull();
  });
});

describe('POST /api/v1/requests/:id/assign — guardrails', () => {
  async function readyForAssign() {
    const admin = await loginAs('admin');
    const material = await factories.material();
    const resident = await factories.resident({ address: 'Center 5' });
    const pr = await factories.pickupRequest({
      residentId: resident.id,
      materialId: material.id,
      address: 'Center 5',
    });
    return { admin, material, resident, pr };
  }

  test('happy path: ACTIVE+onShift+within-cap+area-match → 200, assigned, audit', async () => {
    const ctx = await readyForAssign();
    const w = await factories.worker({ serviceAreas: ['Center'], onShift: true });
    const res = await ctx.admin.agent
      .post(`/api/v1/requests/${ctx.pr.id}/assign`)
      .send({ workerId: w.id });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(OrderStatus.ASSIGNED);
    expect(res.body.data.assignedWorkerId).toBe(w.id);
    const log = await prisma.activityLog.findFirst({
      where: { action: ActivityAction.ORDER_ASSIGNED, entityId: ctx.pr.id },
    });
    expect(log).not.toBeNull();
    // The worker also gets a Notification.
    const notes = await prisma.notification.findMany({ where: { userId: w.id } });
    expect(notes).toHaveLength(1);
  });

  test('guardrail 1: worker accountStatus !== ACTIVE → 409', async () => {
    const ctx = await readyForAssign();
    const w = await factories.pendingWorker();
    const res = await ctx.admin.agent
      .post(`/api/v1/requests/${ctx.pr.id}/assign`)
      .send({ workerId: w.id });
    expect(res.status).toBe(409);
    expect(res.body.error.toLowerCase()).toMatch(/not active/);
  });

  test('guardrail 2: worker offShift → 409', async () => {
    const ctx = await readyForAssign();
    const w = await factories.worker({ onShift: false });
    const res = await ctx.admin.agent
      .post(`/api/v1/requests/${ctx.pr.id}/assign`)
      .send({ workerId: w.id });
    expect(res.status).toBe(409);
    expect(res.body.error.toLowerCase()).toMatch(/not on shift/);
  });

  test('guardrail 3: maxConcurrentOrders cap', async () => {
    const ctx = await readyForAssign();
    const w = await factories.worker({ maxConcurrentOrders: 1, serviceAreas: ['Center'] });
    // Pre-fill one active assignment.
    await factories.pickupRequest({
      residentId: ctx.resident.id,
      materialId: ctx.material.id,
      address: 'Center 5',
      status: OrderStatus.ASSIGNED,
      assignedWorkerId: w.id,
    });
    const res = await ctx.admin.agent
      .post(`/api/v1/requests/${ctx.pr.id}/assign`)
      .send({ workerId: w.id });
    expect(res.status).toBe(409);
    expect(res.body.error.toLowerCase()).toMatch(/capacity/);
  });

  test('guardrail 4: serviceAreas does not cover address → 409', async () => {
    const ctx = await readyForAssign();
    const w = await factories.worker({ serviceAreas: ['Faraway'] });
    const res = await ctx.admin.agent
      .post(`/api/v1/requests/${ctx.pr.id}/assign`)
      .send({ workerId: w.id });
    expect(res.status).toBe(409);
    expect(res.body.error.toLowerCase()).toMatch(/service area/);
  });

  test('cannot assign a request that is not pending or accepted', async () => {
    const ctx = await readyForAssign();
    await prisma.pickupRequest.update({
      where: { id: ctx.pr.id },
      data: { status: OrderStatus.COMPLETED },
    });
    const w = await factories.worker({ serviceAreas: ['Center'] });
    const res = await ctx.admin.agent
      .post(`/api/v1/requests/${ctx.pr.id}/assign`)
      .send({ workerId: w.id });
    expect(res.status).toBe(409);
  });

  test('worker not found → 404', async () => {
    const ctx = await readyForAssign();
    const res = await ctx.admin.agent
      .post(`/api/v1/requests/${ctx.pr.id}/assign`)
      .send({ workerId: '00000000-0000-0000-0000-000000000000' });
    expect(res.status).toBe(404);
  });

  test('non-worker user as workerId → 400', async () => {
    const ctx = await readyForAssign();
    const r = await factories.resident();
    const res = await ctx.admin.agent
      .post(`/api/v1/requests/${ctx.pr.id}/assign`)
      .send({ workerId: r.id });
    expect(res.status).toBe(400);
  });

  test('non-admin → 403', async () => {
    const ctx = await readyForAssign();
    const w = await factories.worker({ serviceAreas: ['Center'] });
    const me = await loginAs('worker');
    const res = await me.agent
      .post(`/api/v1/requests/${ctx.pr.id}/assign`)
      .send({ workerId: w.id });
    expect(res.status).toBe(403);
  });

  test('reassignment writes order.reassigned (not order.assigned)', async () => {
    const ctx = await readyForAssign();
    const w1 = await factories.worker({ serviceAreas: ['Center'] });
    const w2 = await factories.worker({ serviceAreas: ['Center'] });

    // First assignment.
    const r1 = await ctx.admin.agent
      .post(`/api/v1/requests/${ctx.pr.id}/assign`)
      .send({ workerId: w1.id });
    expect(r1.status).toBe(200);

    // Now move the order back to pending so it's assignable again.
    // (The /assign route only accepts pending/accepted; reassignment in production
    // generally happens after a transition. We model that by resetting status here.)
    await prisma.pickupRequest.update({
      where: { id: ctx.pr.id },
      data: { status: OrderStatus.PENDING },
    });

    const r2 = await ctx.admin.agent
      .post(`/api/v1/requests/${ctx.pr.id}/assign`)
      .send({ workerId: w2.id });
    expect(r2.status).toBe(200);

    const reassigned = await prisma.activityLog.findFirst({
      where: { action: ActivityAction.ORDER_REASSIGNED, entityId: ctx.pr.id },
    });
    expect(reassigned).not.toBeNull();
  });

  test('optimistic concurrency: a stale assignment loses with 409', async () => {
    const ctx = await readyForAssign();
    const w1 = await factories.worker({ serviceAreas: ['Center'] });
    const w2 = await factories.worker({ serviceAreas: ['Center'] });

    // Simulate a concurrent admin: flip status to ASSIGNED out of band, so the
    // updateMany predicate ("status === pending") matches nothing on our request.
    await prisma.pickupRequest.update({
      where: { id: ctx.pr.id },
      data: { status: OrderStatus.ASSIGNED, assignedWorkerId: w1.id },
    });

    const res = await ctx.admin.agent
      .post(`/api/v1/requests/${ctx.pr.id}/assign`)
      .send({ workerId: w2.id });
    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/v1/requests/:id (soft delete)', () => {
  test('resident can delete own pending; admin sees a request.cancelled audit row', async () => {
    const m = await factories.material();
    const me = await loginAs('resident');
    const pr = await factories.pickupRequest({ residentId: me.user.id, materialId: m.id });
    const res = await me.agent.delete(`/api/v1/requests/${pr.id}`);
    expect(res.status).toBe(200);
    const row = await prisma.pickupRequest.findUnique({ where: { id: pr.id } });
    expect(row!.deletedAt).toBeInstanceOf(Date);
    expect(row!.status).toBe(OrderStatus.CANCELLED);
    const log = await prisma.activityLog.findFirst({
      where: { action: ActivityAction.REQUEST_CANCELLED, entityId: pr.id },
    });
    expect(log).not.toBeNull();
  });

  test('resident deleting non-pending → 400', async () => {
    const m = await factories.material();
    const me = await loginAs('resident');
    const pr = await factories.pickupRequest({
      residentId: me.user.id,
      materialId: m.id,
      status: OrderStatus.ASSIGNED,
    });
    const res = await me.agent.delete(`/api/v1/requests/${pr.id}`);
    expect(res.status).toBe(400);
  });

  test("resident deleting another resident's → 403", async () => {
    const m = await factories.material();
    const me = await loginAs('resident');
    const other = await factories.resident();
    const pr = await factories.pickupRequest({ residentId: other.id, materialId: m.id });
    const res = await me.agent.delete(`/api/v1/requests/${pr.id}`);
    expect(res.status).toBe(403);
  });

  test('worker → 403', async () => {
    const m = await factories.material();
    const r = await factories.resident();
    const me = await loginAs('worker');
    const pr = await factories.pickupRequest({ residentId: r.id, materialId: m.id });
    const res = await me.agent.delete(`/api/v1/requests/${pr.id}`);
    expect(res.status).toBe(403);
  });

  test('admin can delete any', async () => {
    const ctx = await setupAdminAndMaterial();
    const r = await factories.resident();
    const pr = await factories.pickupRequest({ residentId: r.id, materialId: ctx.material.id });
    const res = await ctx.admin.agent.delete(`/api/v1/requests/${pr.id}`);
    expect(res.status).toBe(200);
  });
});
