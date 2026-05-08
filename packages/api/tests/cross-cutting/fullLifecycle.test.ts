import path from 'path';
import fs from 'fs';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '@ekonaryn/db';
import { AccountStatus, ActivityAction, OrderStatus } from '@ekonaryn/shared';
import { factories } from '../factories';
import { loginAs } from '../auth';
import { resetDb } from '../helpers';

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
const PNG_PATH = path.resolve(FIXTURES_DIR, 'tiny.png');

beforeAll(() => {
  if (!fs.existsSync(PNG_PATH)) {
    if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });
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

// End-to-end happy path through the API: resident registers → admin approves
// the worker → admin assigns the request → worker logs the collection →
// resident's points are credited → ActivityLog has the full chain.
describe('Cross-cutting: end-to-end happy path', () => {
  test('resident registration → worker approval → assign → collect → points + audit chain', async () => {
    const { agent: adminAgent } = await loginAs('admin');

    // 1. Resident registers via the public endpoint.
    const reg = await request(app).post('/api/v1/auth/register/resident').send({
      name: 'New Resident',
      phone: '+996700987654',
      password: 'pass1234',
      address: 'Center 9',
    });
    expect(reg.status).toBe(201);

    // 2. A worker registers as PENDING_APPROVAL.
    const workerReg = await request(app)
      .post('/api/v1/auth/register/worker')
      .field('name', 'New Worker')
      .field('phone', '+996700987655')
      .field('password', 'pass1234')
      .field('idNumber', 'AN-XYZ')
      .field('serviceAreas', JSON.stringify(['Center']))
      .field('vehicleType', 'pickup')
      .field('vehiclePlate', '01KGNEW01')
      .field('vehicleCapacityKg', '500')
      .attach('idDocument', PNG_PATH);
    expect(workerReg.status).toBe(201);
    const workerId = workerReg.body.data.user.id;

    // 3. Worker can't log in yet.
    const earlyLogin = await request(app).post('/api/v1/auth/login').send({
      phone: '+996700987655',
      password: 'pass1234',
    });
    expect(earlyLogin.status).toBe(403);

    // 4. Admin approves the worker.
    const approve = await adminAgent.post(`/api/v1/users/${workerId}/approve`);
    expect(approve.status).toBe(200);
    expect(approve.body.data.accountStatus).toBe(AccountStatus.ACTIVE);

    // 4b. Worker now needs to be on shift to be assignable.
    await prisma.user.update({ where: { id: workerId }, data: { onShift: true } });

    // 5. Resident creates a pickup request via login.
    const residentLogin = await request(app).post('/api/v1/auth/login').send({
      phone: '+996700987654',
      password: 'pass1234',
    });
    const residentToken = residentLogin.body.data.accessToken;
    const residentId = residentLogin.body.data.user.id;
    const material = await factories.material();
    const requestRes = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({ materialId: material.id, address: 'Center 9', estimatedQty: 6 });
    expect(requestRes.status).toBe(201);
    const pickupId = requestRes.body.data.id;

    // 6. Admin assigns the order to our newly-approved worker.
    const assign = await adminAgent.post(`/api/v1/requests/${pickupId}/assign`).send({ workerId });
    expect(assign.status).toBe(200);

    // 7. Worker logs the collection.
    const workerLogin = await request(app).post('/api/v1/auth/login').send({
      phone: '+996700987655',
      password: 'pass1234',
    });
    const workerToken = workerLogin.body.data.accessToken;
    const collectRes = await request(app)
      .post('/api/v1/collections')
      .set('Authorization', `Bearer ${workerToken}`)
      .field('requestId', pickupId)
      .field('materialId', material.id)
      .field('actualWeightKg', '6.0');
    expect(collectRes.status).toBe(201);

    // 8. Resident's points are credited.
    const residentRow = await prisma.user.findUnique({ where: { id: residentId } });
    expect(residentRow!.points).toBe(6);

    // 9. ActivityLog has the full chain.
    const actions = (await prisma.activityLog.findMany({ orderBy: { createdAt: 'asc' } })).map(
      (r) => r.action,
    );
    for (const expected of [
      ActivityAction.WORKER_REGISTERED,
      ActivityAction.WORKER_APPROVED,
      ActivityAction.AUTH_LOGIN,
      ActivityAction.REQUEST_CREATED,
      ActivityAction.ORDER_ASSIGNED,
      ActivityAction.ORDER_STATUS_CHANGED,
    ]) {
      expect(actions).toContain(expected);
    }
  });
});
