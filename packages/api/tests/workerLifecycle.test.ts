import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../src/app';
import { prisma } from '@ekonaryn/db';
import { AccountStatus, OrderStatus, ActivityAction } from '@ekonaryn/shared';
import {
  resetDb,
  createAdmin,
  createResident,
  createWorker,
  createMaterial,
  createPendingRequest,
} from './helpers';

const TMP_DOCUMENT = path.resolve(__dirname, 'fixtures/dummy-id.png');

beforeAll(() => {
  // Create a tiny PNG so we can submit it via multipart in worker registration tests.
  const dir = path.dirname(TMP_DOCUMENT);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(TMP_DOCUMENT)) {
    // 1x1 transparent PNG
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9ZGv9YgAAAAASUVORK5CYII=',
      'base64',
    );
    fs.writeFileSync(TMP_DOCUMENT, png);
  }
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function loginAs(phone: string, password: string) {
  return request(app).post('/api/v1/auth/login').send({ phone, password });
}

describe('Worker registration & approval', () => {
  test('worker registration creates a pending_approval account and does NOT issue tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/worker')
      .field('name', 'Test Applicant')
      .field('phone', '+996700333000')
      .field('password', 'worker123')
      .field('idNumber', 'AN0000001')
      .field('serviceAreas', JSON.stringify(['Center']))
      .field('vehicleType', 'pickup')
      .field('vehiclePlate', '01KGTEST01')
      .field('vehicleCapacityKg', '600')
      .attach('idDocument', TMP_DOCUMENT);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.accountStatus).toBe(AccountStatus.PENDING_APPROVAL);
    expect(res.body.data.accessToken).toBeUndefined();
    expect(res.body.data.refreshToken).toBeUndefined();

    const created = await prisma.user.findUnique({ where: { phone: '+996700333000' } });
    expect(created?.accountStatus).toBe(AccountStatus.PENDING_APPROVAL);
    expect(created?.idDocumentUrl).toMatch(/^\/uploads\//);

    const log = await prisma.activityLog.findFirst({
      where: { action: ActivityAction.WORKER_REGISTERED, entityId: created?.id },
    });
    expect(log).not.toBeNull();
  });

  test('an unapproved worker cannot log in and the attempt is logged', async () => {
    const worker = await createWorker({
      phone: '+996700333111',
      password: 'worker123',
      status: AccountStatus.PENDING_APPROVAL,
    });

    const res = await loginAs(worker.phone, 'worker123');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/under review/i);

    const blocked = await prisma.activityLog.findFirst({
      where: { action: ActivityAction.AUTH_LOGIN_BLOCKED, entityId: worker.id },
    });
    expect(blocked).not.toBeNull();
  });

  test('a rejected worker cannot log in and sees the reason', async () => {
    const worker = await createWorker({
      phone: '+996700333222',
      password: 'worker123',
      status: AccountStatus.REJECTED,
    });
    await prisma.user.update({
      where: { id: worker.id },
      data: { statusReason: 'Documents unclear' },
    });

    const res = await loginAs(worker.phone, 'worker123');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Documents unclear/);
  });

  test('admin approval flips worker to ACTIVE, lets them log in, and writes an audit log', async () => {
    const admin = await createAdmin();
    const worker = await createWorker({
      phone: '+996700333333',
      password: 'worker123',
      status: AccountStatus.PENDING_APPROVAL,
    });

    const adminLogin = await loginAs(admin.phone, 'admin123');
    expect(adminLogin.status).toBe(200);
    const adminToken = adminLogin.body.data.accessToken;

    const approve = await request(app)
      .post(`/api/v1/users/${worker.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approve.status).toBe(200);
    expect(approve.body.data.accountStatus).toBe(AccountStatus.ACTIVE);

    const workerLogin = await loginAs(worker.phone, 'worker123');
    expect(workerLogin.status).toBe(200);
    expect(workerLogin.body.data.user.accountStatus).toBe(AccountStatus.ACTIVE);

    const approvalLog = await prisma.activityLog.findFirst({
      where: { action: ActivityAction.WORKER_APPROVED, entityId: worker.id },
    });
    expect(approvalLog).not.toBeNull();
    const meta = JSON.parse(approvalLog!.metadata!);
    expect(meta.before.accountStatus).toBe('PENDING_APPROVAL');
    expect(meta.after.accountStatus).toBe('ACTIVE');
  });

  test('rejecting a worker requires a reason', async () => {
    const admin = await createAdmin();
    const worker = await createWorker({
      phone: '+996700333444',
      status: AccountStatus.PENDING_APPROVAL,
    });
    const adminLogin = await loginAs(admin.phone, 'admin123');
    const adminToken = adminLogin.body.data.accessToken;

    const noReason = await request(app)
      .post(`/api/v1/users/${worker.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(noReason.status).toBe(400);

    const ok = await request(app)
      .post(`/api/v1/users/${worker.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Failed verification' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.accountStatus).toBe(AccountStatus.REJECTED);
  });
});

describe('Order assignment guardrails', () => {
  async function assignmentSetup() {
    const admin = await createAdmin();
    const resident = await createResident({ address: 'Center 5, Naryn' });
    const material = await createMaterial();
    const adminLogin = await loginAs(admin.phone, 'admin123');
    return { admin, resident, material, adminToken: adminLogin.body.data.accessToken };
  }

  test('cannot assign to a non-active worker (pending/rejected/suspended)', async () => {
    const { resident, material, adminToken } = await assignmentSetup();
    const req1 = await createPendingRequest(resident.id, material.id);

    const pendingWorker = await createWorker({
      phone: '+996700444111',
      status: AccountStatus.PENDING_APPROVAL,
    });
    const rejectedWorker = await createWorker({
      phone: '+996700444222',
      status: AccountStatus.REJECTED,
    });
    const suspendedWorker = await createWorker({
      phone: '+996700444333',
      status: AccountStatus.SUSPENDED,
    });

    for (const w of [pendingWorker, rejectedWorker, suspendedWorker]) {
      const res = await request(app)
        .post(`/api/v1/requests/${req1.id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ workerId: w.id });
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/not active/i);
    }
  });

  test('cannot assign to an active worker who is off shift', async () => {
    const { resident, material, adminToken } = await assignmentSetup();
    const req1 = await createPendingRequest(resident.id, material.id);
    const offShift = await createWorker({ phone: '+996700444444', onShift: false });

    const res = await request(app)
      .post(`/api/v1/requests/${req1.id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ workerId: offShift.id });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/not on shift/i);
  });

  test('cannot exceed the worker maxConcurrentOrders cap', async () => {
    const { resident, material, adminToken } = await assignmentSetup();
    const worker = await createWorker({
      phone: '+996700444555',
      maxConcurrentOrders: 1,
      onShift: true,
    });

    const r1 = await createPendingRequest(resident.id, material.id);
    const r2 = await createPendingRequest(resident.id, material.id);

    const ok = await request(app)
      .post(`/api/v1/requests/${r1.id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ workerId: worker.id });
    expect(ok.status).toBe(200);

    const overCap = await request(app)
      .post(`/api/v1/requests/${r2.id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ workerId: worker.id });
    expect(overCap.status).toBe(409);
    expect(overCap.body.error).toMatch(/capacity/i);
  });

  test("rejects assignment when worker's service areas don't cover the address", async () => {
    const { resident, material, adminToken } = await assignmentSetup();
    const req1 = await createPendingRequest(resident.id, material.id, 'Faraway 1, Naryn');
    const worker = await createWorker({
      phone: '+996700444666',
      serviceAreas: ['Center', 'Mikrorayon'],
    });

    const res = await request(app)
      .post(`/api/v1/requests/${req1.id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ workerId: worker.id });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/service area/i);
  });

  test('successful assignment: marks request assigned, sets worker, writes audit log', async () => {
    const { resident, material, adminToken } = await assignmentSetup();
    const req1 = await createPendingRequest(resident.id, material.id, 'Center 7, Naryn');
    const worker = await createWorker({ phone: '+996700444777', serviceAreas: ['Center'] });

    const res = await request(app)
      .post(`/api/v1/requests/${req1.id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ workerId: worker.id });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(OrderStatus.ASSIGNED);
    expect(res.body.data.assignedWorkerId).toBe(worker.id);

    const log = await prisma.activityLog.findFirst({
      where: { action: ActivityAction.ORDER_ASSIGNED, entityId: req1.id },
    });
    expect(log).not.toBeNull();
  });
});

describe('Order lifecycle enforcement', () => {
  test('illegal direct jumps from pending to completed are rejected', async () => {
    const admin = await createAdmin();
    const resident = await createResident();
    const material = await createMaterial();
    const adminLogin = await loginAs(admin.phone, 'admin123');
    const adminToken = adminLogin.body.data.accessToken;

    const req1 = await createPendingRequest(resident.id, material.id);

    const res = await request(app)
      .put(`/api/v1/requests/${req1.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Illegal order transition/);
  });

  test('legal transitions (pending → accepted → assigned → in_progress → completed) succeed', async () => {
    const admin = await createAdmin();
    const resident = await createResident({ address: 'Center 1' });
    const material = await createMaterial();
    const worker = await createWorker({ serviceAreas: ['Center'] });
    const adminLogin = await loginAs(admin.phone, 'admin123');
    const adminToken = adminLogin.body.data.accessToken;

    const req1 = await createPendingRequest(resident.id, material.id, 'Center 9');

    const accepted = await request(app)
      .put(`/api/v1/requests/${req1.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'accepted' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.status).toBe('accepted');

    const assigned = await request(app)
      .post(`/api/v1/requests/${req1.id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ workerId: worker.id });
    expect(assigned.status).toBe(200);

    const inProgress = await request(app)
      .put(`/api/v1/requests/${req1.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'in_progress' });
    expect(inProgress.status).toBe(200);

    const completed = await request(app)
      .put(`/api/v1/requests/${req1.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'completed' });
    expect(completed.status).toBe(200);
    expect(completed.body.data.status).toBe('completed');

    const statusLogs = await prisma.activityLog.findMany({
      where: { entityId: req1.id, action: ActivityAction.ORDER_STATUS_CHANGED },
    });
    expect(statusLogs.length).toBeGreaterThanOrEqual(3);
  });

  test('terminal states cannot transition further', async () => {
    const admin = await createAdmin();
    const resident = await createResident();
    const material = await createMaterial();
    const adminLogin = await loginAs(admin.phone, 'admin123');
    const adminToken = adminLogin.body.data.accessToken;

    const req1 = await prisma.pickupRequest.create({
      data: {
        residentId: resident.id,
        materialId: material.id,
        address: 'Anywhere',
        estimatedQty: 5,
        status: 'cancelled',
      },
    });

    const res = await request(app)
      .put(`/api/v1/requests/${req1.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'pending' });
    expect(res.status).toBe(409);
  });
});

describe('Auth + activity logging', () => {
  test('successful login writes auth.login activity log', async () => {
    const admin = await createAdmin();
    const res = await loginAs(admin.phone, 'admin123');
    expect(res.status).toBe(200);

    const log = await prisma.activityLog.findFirst({
      where: { action: ActivityAction.AUTH_LOGIN, entityId: admin.id },
    });
    expect(log).not.toBeNull();
  });

  test('resident creating a request writes request.created activity log', async () => {
    const resident = await createResident();
    const material = await createMaterial();
    const login = await loginAs(resident.phone, 'resident123');
    const token = login.body.data.accessToken;

    const res = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ materialId: material.id, address: 'Center 3', estimatedQty: 8 });
    expect(res.status).toBe(201);

    const log = await prisma.activityLog.findFirst({
      where: { action: ActivityAction.REQUEST_CREATED, entityId: res.body.data.id },
    });
    expect(log).not.toBeNull();
  });
});
