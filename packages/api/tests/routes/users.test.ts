import request from 'supertest';
import app from '../../src/app';
import { prisma } from '@ekonaryn/db';
import { ActivityAction, AccountStatus } from '@ekonaryn/shared';
import { factories } from '../factories';
import { loginAs } from '../auth';
import { resetDb } from '../helpers';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/v1/users', () => {
  test('admin: lists all non-soft-deleted users', async () => {
    const { agent } = await loginAs('admin');
    await factories.resident();
    await factories.worker();
    const deleted = await factories.resident();
    await prisma.user.update({ where: { id: deleted.id }, data: { deletedAt: new Date() } });

    const res = await agent.get('/api/v1/users');
    expect(res.status).toBe(200);
    const phones = res.body.data.map((u: { phone: string }) => u.phone);
    expect(phones).not.toContain(deleted.phone);
  });

  test('non-admin → 403', async () => {
    const { agent } = await loginAs('resident');
    const res = await agent.get('/api/v1/users');
    expect(res.status).toBe(403);
  });

  test('filters by role', async () => {
    const { agent } = await loginAs('admin');
    await factories.worker();
    await factories.resident();
    const res = await agent.get('/api/v1/users?role=WORKER');
    expect(res.status).toBe(200);
    for (const u of res.body.data) expect(u.role).toBe('WORKER');
  });

  test('filters by accountStatus', async () => {
    const { agent } = await loginAs('admin');
    await factories.pendingWorker();
    await factories.worker();
    const res = await agent.get('/api/v1/users?role=WORKER&accountStatus=PENDING_APPROVAL');
    expect(res.status).toBe(200);
    for (const u of res.body.data) expect(u.accountStatus).toBe('PENDING_APPROVAL');
  });

  test('search matches name (substring)', async () => {
    const { agent } = await loginAs('admin');
    await factories.worker({ name: 'Findable Worker' });
    await factories.worker({ name: 'Other Person' });
    const res = await agent.get('/api/v1/users?search=Findable');
    expect(res.status).toBe(200);
    expect(res.body.data.some((u: { name: string }) => u.name === 'Findable Worker')).toBe(true);
    expect(res.body.data.every((u: { name: string }) => u.name !== 'Other Person')).toBe(true);
  });

  test('paginates with page+limit', async () => {
    const { agent } = await loginAs('admin');
    for (let i = 0; i < 5; i++) await factories.resident();
    const res = await agent.get('/api/v1/users?limit=2&page=1');
    expect(res.body.data.length).toBe(2);
    expect(res.body.total).toBeGreaterThanOrEqual(6); // 5 + the admin
  });
});

describe('GET /api/v1/users/workers/pending', () => {
  test('admin sees only PENDING_APPROVAL workers (no active, no deleted)', async () => {
    const { agent } = await loginAs('admin');
    const pending = await factories.pendingWorker();
    await factories.worker(); // active
    await factories.rejectedWorker();
    const deletedPending = await factories.pendingWorker();
    await prisma.user.update({
      where: { id: deletedPending.id },
      data: { deletedAt: new Date() },
    });

    const res = await agent.get('/api/v1/users/workers/pending');
    expect(res.status).toBe(200);
    const ids = res.body.data.map((u: { id: string }) => u.id);
    expect(ids).toContain(pending.id);
    expect(ids).not.toContain(deletedPending.id);
    for (const u of res.body.data) expect(u.accountStatus).toBe('PENDING_APPROVAL');
  });

  test('non-admin → 403', async () => {
    const { agent } = await loginAs('worker');
    const res = await agent.get('/api/v1/users/workers/pending');
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/users/:id', () => {
  test('admin can fetch any user', async () => {
    const { agent } = await loginAs('admin');
    const r = await factories.resident();
    const res = await agent.get(`/api/v1/users/${r.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(r.id);
  });

  test('non-admin can fetch self', async () => {
    const { user, agent } = await loginAs('resident');
    const res = await agent.get(`/api/v1/users/${user.id}`);
    expect(res.status).toBe(200);
  });

  test('non-admin fetching someone else → 403', async () => {
    const { agent } = await loginAs('resident');
    const other = await factories.resident();
    const res = await agent.get(`/api/v1/users/${other.id}`);
    expect(res.status).toBe(403);
  });

  test('returns the public projection (no password, no verificationCode)', async () => {
    const { agent } = await loginAs('admin');
    const u = await factories.resident();
    const res = await agent.get(`/api/v1/users/${u.id}`);
    const data = res.body.data as Record<string, unknown>;
    expect(data.password).toBeUndefined();
    expect(data.verificationCode).toBeUndefined();
  });

  test('GET /users/:id returns 404 for a soft-deleted user (matches list endpoint behavior)', async () => {
    const { agent } = await loginAs('admin');
    const u = await factories.resident();
    await prisma.user.update({ where: { id: u.id }, data: { deletedAt: new Date() } });
    const res = await agent.get(`/api/v1/users/${u.id}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/users/:id', () => {
  test('self can update name', async () => {
    const { user, agent } = await loginAs('resident');
    const res = await agent.put(`/api/v1/users/${user.id}`).send({ name: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('New Name');
  });

  test('self CANNOT change role', async () => {
    const { user, agent } = await loginAs('resident');
    const res = await agent.put(`/api/v1/users/${user.id}`).send({ role: 'ADMIN' });
    expect(res.status).toBe(403);
  });

  test('self CANNOT change accountStatus', async () => {
    const { user, agent } = await loginAs('resident');
    const res = await agent.put(`/api/v1/users/${user.id}`).send({ accountStatus: 'SUSPENDED' });
    expect(res.status).toBe(403);
  });

  test('admin can change role', async () => {
    const { agent } = await loginAs('admin');
    const u = await factories.resident();
    const res = await agent.put(`/api/v1/users/${u.id}`).send({ role: 'WORKER' });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('WORKER');
  });

  test('non-admin updating someone else → 403', async () => {
    const { agent } = await loginAs('resident');
    const other = await factories.resident();
    const res = await agent.put(`/api/v1/users/${other.id}`).send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });

  test('serviceAreas array is JSON-stringified before storage', async () => {
    const { agent } = await loginAs('admin');
    const w = await factories.worker();
    const res = await agent
      .put(`/api/v1/users/${w.id}`)
      .send({ serviceAreas: ['Center', 'Mikrorayon'] });
    expect(res.status).toBe(200);
    const stored = await prisma.user.findUnique({ where: { id: w.id } });
    expect(JSON.parse(stored!.serviceAreas!)).toEqual(['Center', 'Mikrorayon']);
  });
});

describe('DELETE /api/v1/users/:id (soft delete)', () => {
  test('admin: row keeps existing in DB but disappears from list', async () => {
    const { agent } = await loginAs('admin');
    const u = await factories.resident();
    const del = await agent.delete(`/api/v1/users/${u.id}`);
    expect(del.status).toBe(200);

    const inDb = await prisma.user.findUnique({ where: { id: u.id } });
    expect(inDb).not.toBeNull();
    expect(inDb!.deletedAt).toBeInstanceOf(Date);

    const list = await agent.get('/api/v1/users');
    const phones = list.body.data.map((u: { phone: string }) => u.phone);
    expect(phones).not.toContain(u.phone);
  });

  test('non-admin → 403', async () => {
    const { agent } = await loginAs('resident');
    const other = await factories.resident();
    const res = await agent.delete(`/api/v1/users/${other.id}`);
    expect(res.status).toBe(403);
  });
});

describe('Worker approval transitions', () => {
  describe('POST /:id/approve', () => {
    test('PENDING_APPROVAL → ACTIVE; writes Notification + ActivityLog', async () => {
      const { agent } = await loginAs('admin');
      const w = await factories.pendingWorker();
      const res = await agent.post(`/api/v1/users/${w.id}/approve`);
      expect(res.status).toBe(200);
      expect(res.body.data.accountStatus).toBe(AccountStatus.ACTIVE);

      const notes = await prisma.notification.findMany({ where: { userId: w.id } });
      expect(notes).toHaveLength(1);
      const log = await prisma.activityLog.findFirst({
        where: { action: ActivityAction.WORKER_APPROVED, entityId: w.id },
      });
      expect(log).not.toBeNull();
    });

    test('SUSPENDED → ACTIVE is allowed via approve (compatibility path)', async () => {
      const { agent } = await loginAs('admin');
      const w = await factories.suspendedWorker();
      const res = await agent.post(`/api/v1/users/${w.id}/approve`);
      expect(res.status).toBe(200);
    });

    test('ACTIVE → ACTIVE rejected with 409', async () => {
      const { agent } = await loginAs('admin');
      const w = await factories.worker();
      const res = await agent.post(`/api/v1/users/${w.id}/approve`);
      expect(res.status).toBe(409);
    });

    test('approving a non-worker → 400', async () => {
      const { agent } = await loginAs('admin');
      const r = await factories.resident();
      const res = await agent.post(`/api/v1/users/${r.id}/approve`);
      expect(res.status).toBe(400);
    });

    test('approving a missing user → 404', async () => {
      const { agent } = await loginAs('admin');
      const res = await agent.post('/api/v1/users/00000000-0000-0000-0000-000000000000/approve');
      expect(res.status).toBe(404);
    });

    test('non-admin → 403', async () => {
      const { agent } = await loginAs('worker');
      const w = await factories.pendingWorker();
      const res = await agent.post(`/api/v1/users/${w.id}/approve`);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /:id/reject', () => {
    test('reason required → 400 without it', async () => {
      const { agent } = await loginAs('admin');
      const w = await factories.pendingWorker();
      const res = await agent.post(`/api/v1/users/${w.id}/reject`).send({});
      expect(res.status).toBe(400);
    });

    test('happy path PENDING → REJECTED with reason; logs', async () => {
      const { agent } = await loginAs('admin');
      const w = await factories.pendingWorker();
      const res = await agent.post(`/api/v1/users/${w.id}/reject`).send({
        reason: 'Documents unclear',
      });
      expect(res.status).toBe(200);
      expect(res.body.data.accountStatus).toBe(AccountStatus.REJECTED);
      expect(res.body.data.statusReason).toBe('Documents unclear');
      const log = await prisma.activityLog.findFirst({
        where: { action: ActivityAction.WORKER_REJECTED, entityId: w.id },
      });
      expect(log).not.toBeNull();
    });

    test('cannot reject an active worker (only PENDING_APPROVAL is allowed)', async () => {
      const { agent } = await loginAs('admin');
      const w = await factories.worker();
      const res = await agent
        .post(`/api/v1/users/${w.id}/reject`)
        .send({ reason: 'illegal state transition guard' });
      expect(res.status).toBe(409);
    });
  });

  describe('POST /:id/suspend', () => {
    test('reason required → 400 without it', async () => {
      const { agent } = await loginAs('admin');
      const w = await factories.worker();
      const res = await agent.post(`/api/v1/users/${w.id}/suspend`).send({});
      expect(res.status).toBe(400);
    });

    test('happy path ACTIVE → SUSPENDED with reason; logs', async () => {
      const { agent } = await loginAs('admin');
      const w = await factories.worker();
      const res = await agent.post(`/api/v1/users/${w.id}/suspend`).send({
        reason: 'Customer complaint',
      });
      expect(res.status).toBe(200);
      expect(res.body.data.accountStatus).toBe(AccountStatus.SUSPENDED);
      const log = await prisma.activityLog.findFirst({
        where: { action: ActivityAction.WORKER_SUSPENDED, entityId: w.id },
      });
      expect(log).not.toBeNull();
    });

    test('cannot suspend a pending worker (only ACTIVE)', async () => {
      const { agent } = await loginAs('admin');
      const w = await factories.pendingWorker();
      const res = await agent
        .post(`/api/v1/users/${w.id}/suspend`)
        .send({ reason: 'illegal state transition guard' });
      expect(res.status).toBe(409);
    });
  });

  describe('POST /:id/reactivate', () => {
    test('happy path SUSPENDED → ACTIVE; logs reactivated', async () => {
      const { agent } = await loginAs('admin');
      const w = await factories.suspendedWorker();
      const res = await agent.post(`/api/v1/users/${w.id}/reactivate`).send({ reason: 'cleared' });
      expect(res.status).toBe(200);
      expect(res.body.data.accountStatus).toBe(AccountStatus.ACTIVE);
      const log = await prisma.activityLog.findFirst({
        where: { action: ActivityAction.WORKER_REACTIVATED, entityId: w.id },
      });
      expect(log).not.toBeNull();
    });

    test('reactivate ACTIVE → 409', async () => {
      const { agent } = await loginAs('admin');
      const w = await factories.worker();
      const res = await agent.post(`/api/v1/users/${w.id}/reactivate`).send({});
      expect(res.status).toBe(409);
    });
  });
});
