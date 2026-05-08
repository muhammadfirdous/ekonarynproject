import request from 'supertest';
import app from '../../src/app';
import { resetDb } from '../helpers';
import { loginAs } from '../auth';
import { factories } from '../factories';

beforeEach(async () => {
  await resetDb();
});

describe('IDOR — users', () => {
  test('Resident A cannot read Resident B via GET /users/:id', async () => {
    const a = await loginAs('resident');
    const b = await factories.resident();
    const res = await a.agent.get(`/api/v1/users/${b.id}`);
    expect(res.status).toBe(403);
  });

  test('Resident A cannot update Resident B via PUT /users/:id', async () => {
    const a = await loginAs('resident');
    const b = await factories.resident();
    const res = await a.agent.put(`/api/v1/users/${b.id}`).send({ name: 'Hijacked' });
    expect(res.status).toBe(403);
  });

  test('Worker cannot read another worker via GET /users/:id', async () => {
    const w = await loginAs('worker');
    const other = await factories.worker();
    const res = await w.agent.get(`/api/v1/users/${other.id}`);
    expect(res.status).toBe(403);
  });

  test('Resident CAN read themselves via GET /users/:id (positive control)', async () => {
    const a = await loginAs('resident');
    const res = await a.agent.get(`/api/v1/users/${a.user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(a.user.id);
  });

  test('Admin CAN read any user (positive control)', async () => {
    const admin = await loginAs('admin');
    const target = await factories.resident();
    const res = await admin.agent.get(`/api/v1/users/${target.id}`);
    expect(res.status).toBe(200);
  });
});

describe('IDOR — pickup requests', () => {
  test("Resident A cannot read Resident B's request", async () => {
    const a = await loginAs('resident');
    const b = await factories.resident();
    const mat = await factories.material();
    const req = await factories.pickupRequest({ residentId: b.id, materialId: mat.id });

    const res = await a.agent.get(`/api/v1/requests/${req.id}`);
    expect(res.status).toBe(403);
  });

  test('Worker cannot read a request not assigned to them', async () => {
    const worker = await loginAs('worker');
    const otherWorker = await factories.worker();
    const resident = await factories.resident();
    const mat = await factories.material();
    const req = await factories.pickupRequest({
      residentId: resident.id,
      materialId: mat.id,
      assignedWorkerId: otherWorker.id,
      status: 'assigned',
    });

    const res = await worker.agent.get(`/api/v1/requests/${req.id}`);
    expect(res.status).toBe(403);
  });

  test('Resident sees only their own requests in GET /requests', async () => {
    const a = await loginAs('resident');
    const b = await factories.resident();
    const mat = await factories.material();
    await factories.pickupRequest({ residentId: a.user.id, materialId: mat.id });
    await factories.pickupRequest({ residentId: b.id, materialId: mat.id });
    await factories.pickupRequest({ residentId: b.id, materialId: mat.id });

    const res = await a.agent.get('/api/v1/requests?limit=50');
    expect(res.status).toBe(200);
    const rows = res.body.data as Array<{ residentId: string }>;
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => expect(row.residentId).toBe(a.user.id));
  });

  test('Worker sees only orders assigned to them in GET /requests', async () => {
    const me = await loginAs('worker');
    const other = await factories.worker();
    const resident = await factories.resident();
    const mat = await factories.material();
    await factories.pickupRequest({
      residentId: resident.id,
      materialId: mat.id,
      assignedWorkerId: me.user.id,
      status: 'assigned',
    });
    await factories.pickupRequest({
      residentId: resident.id,
      materialId: mat.id,
      assignedWorkerId: other.id,
      status: 'assigned',
    });

    const res = await me.agent.get('/api/v1/requests?limit=50');
    expect(res.status).toBe(200);
    const rows = res.body.data as Array<{ assignedWorkerId: string }>;
    rows.forEach((row) => expect(row.assignedWorkerId).toBe(me.user.id));
  });

  test("Worker cannot transition another worker's order via PUT /:id/status", async () => {
    const me = await loginAs('worker');
    const other = await factories.worker();
    const resident = await factories.resident();
    const mat = await factories.material();
    const req = await factories.pickupRequest({
      residentId: resident.id,
      materialId: mat.id,
      assignedWorkerId: other.id,
      status: 'assigned',
    });

    const res = await me.agent
      .put(`/api/v1/requests/${req.id}/status`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(403);
  });
});
