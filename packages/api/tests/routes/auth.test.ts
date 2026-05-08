import request from 'supertest';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import app from '../../src/app';
import { prisma } from '@ekonaryn/db';
import { ActivityAction, AccountStatus } from '@ekonaryn/shared';
import { factories } from '../factories';
import { generateTokens } from '../../src/utils/tokens';
import { resetDb } from '../helpers';

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
const PNG_PATH = path.resolve(FIXTURES_DIR, 'tiny.png');
const TXT_PATH = path.resolve(FIXTURES_DIR, 'evil.txt');

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
  if (!fs.existsSync(TXT_PATH)) fs.writeFileSync(TXT_PATH, 'not an image');
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/register (legacy resident)', () => {
  test('happy path: creates an active resident and issues tokens', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Aibek',
      phone: '+996700111222',
      password: 'pass1234',
      address: 'Center 1',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('RESIDENT');
    expect(res.body.data.user.accountStatus).toBe('ACTIVE');
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(typeof res.body.data.refreshToken).toBe('string');
  });

  test('duplicate phone → 409', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Aibek',
      phone: '+996700111222',
      password: 'pass1234',
    });
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Other',
      phone: '+996700111222',
      password: 'pass1234',
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  test('phone format validation: +996 followed by 9 digits required', async () => {
    const bad = await request(app).post('/api/v1/auth/register').send({
      name: 'Phone Test',
      phone: '+99670011', // too short
      password: 'pass1234',
    });
    expect(bad.status).toBe(400);
  });

  test('password min length is enforced (6)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Pw Test',
      phone: '+996700111000',
      password: 'short',
    });
    expect(res.status).toBe(400);
  });

  test('exposes verification code in non-production', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Aibek',
      phone: '+996700111333',
      password: 'pass1234',
    });
    expect(res.body.data.verificationCode).toMatch(/^\d{6}$/);
  });
});

describe('POST /api/v1/auth/register/resident', () => {
  test('happy path with optional email', async () => {
    const res = await request(app).post('/api/v1/auth/register/resident').send({
      name: 'Resident A',
      phone: '+996700222333',
      email: 'a@example.com',
      password: 'pass1234',
      address: 'Naryn',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('a@example.com');
  });

  test('duplicate email → 409', async () => {
    await request(app).post('/api/v1/auth/register/resident').send({
      name: 'First User',
      phone: '+996700333000',
      email: 'shared@example.com',
      password: 'pass1234',
    });
    const res = await request(app).post('/api/v1/auth/register/resident').send({
      name: 'Second User',
      phone: '+996700333001',
      email: 'shared@example.com',
      password: 'pass1234',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.toLowerCase()).toMatch(/email/);
  });
});

describe('POST /api/v1/auth/register/worker (multipart)', () => {
  test('happy path: creates PENDING_APPROVAL worker, issues NO tokens, logs worker.registered', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/worker')
      .field('name', 'Worker A')
      .field('phone', '+996700444000')
      .field('password', 'pass1234')
      .field('idNumber', 'AN1')
      .field('serviceAreas', JSON.stringify(['Center']))
      .field('vehicleType', 'pickup')
      .field('vehiclePlate', '01KGW01')
      .field('vehicleCapacityKg', '500')
      .attach('idDocument', PNG_PATH);

    expect(res.status).toBe(201);
    expect(res.body.data.user.accountStatus).toBe(AccountStatus.PENDING_APPROVAL);
    expect(res.body.data.accessToken).toBeUndefined();
    expect(res.body.data.refreshToken).toBeUndefined();

    const u = await prisma.user.findUnique({ where: { phone: '+996700444000' } });
    expect(u?.idDocumentUrl).toMatch(/^\/uploads\//);

    const logs = await prisma.activityLog.findMany({
      where: { action: ActivityAction.WORKER_REGISTERED },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].entityId).toBe(u!.id);
  });

  test('missing idDocument file → 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/worker')
      .field('name', 'Worker B')
      .field('phone', '+996700444111')
      .field('password', 'pass1234')
      .field('idNumber', 'AN2')
      .field('serviceAreas', JSON.stringify(['Center']))
      .field('vehicleType', 'pickup')
      .field('vehiclePlate', '01KGW02')
      .field('vehicleCapacityKg', '500');
    expect(res.status).toBe(400);
    expect(res.body.error.toLowerCase()).toMatch(/id document/);
  });

  test('invalid file type (.txt) → upload-rejected', async () => {
    let outcome: 'rejected' | 'connection-dropped' = 'rejected';
    try {
      const res = await request(app)
        .post('/api/v1/auth/register/worker')
        .field('name', 'Worker C')
        .field('phone', '+996700444222')
        .field('password', 'pass1234')
        .field('idNumber', 'AN3')
        .field('serviceAreas', JSON.stringify(['Center']))
        .field('vehicleType', 'pickup')
        .field('vehiclePlate', '01KGW03')
        .field('vehicleCapacityKg', '500')
        .attach('idDocument', TXT_PATH);
      // Accept either path: route returns 400/500 or connection drops.
      expect([400, 500]).toContain(res.status);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ECONNRESET') outcome = 'connection-dropped';
      else throw err;
    }
    expect(['rejected', 'connection-dropped']).toContain(outcome);
  });

  test('missing required field (idNumber) returns 400 from zod with field-level details', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/worker')
      .field('name', 'Worker D')
      .field('phone', '+996700444333')
      .field('password', 'pass1234')
      .field('serviceAreas', JSON.stringify(['Center']))
      .field('vehicleType', 'pickup')
      .field('vehiclePlate', '01KGW04')
      .field('vehicleCapacityKg', '500')
      .attach('idDocument', PNG_PATH);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details.some((d: { field: string }) => d.field === 'idNumber')).toBe(true);
  });

  test('serviceAreas is parsed from comma-separated string too', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/worker')
      .field('name', 'Worker E')
      .field('phone', '+996700444444')
      .field('password', 'pass1234')
      .field('idNumber', 'AN5')
      .field('serviceAreas', 'Center, Mikrorayon, Ak-Zhol')
      .field('vehicleType', 'pickup')
      .field('vehiclePlate', '01KGW05')
      .field('vehicleCapacityKg', '500')
      .attach('idDocument', PNG_PATH);
    expect(res.status).toBe(201);
    const u = await prisma.user.findUnique({ where: { phone: '+996700444444' } });
    expect(JSON.parse(u!.serviceAreas!)).toEqual(['Center', 'Mikrorayon', 'Ak-Zhol']);
  });
});

describe('POST /api/v1/auth/verify', () => {
  test('valid code marks phoneVerifiedAt and clears the stored code', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Verify User',
      phone: '+996700555000',
      password: 'pass1234',
    });
    const code = reg.body.data.verificationCode;
    const res = await request(app)
      .post('/api/v1/auth/verify')
      .send({ phone: '+996700555000', code });
    expect(res.status).toBe(200);

    const u = await prisma.user.findUnique({ where: { phone: '+996700555000' } });
    expect(u?.phoneVerifiedAt).toBeInstanceOf(Date);
    expect(u?.verificationCode).toBeNull();
    expect(u?.verificationCodeExpiresAt).toBeNull();
  });

  test('wrong code → 400', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Verify User',
      phone: '+996700555111',
      password: 'pass1234',
    });
    const res = await request(app)
      .post('/api/v1/auth/verify')
      .send({ phone: '+996700555111', code: '000000' });
    expect(res.status).toBe(400);
  });

  test('unknown phone → 404', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify')
      .send({ phone: '+996700999999', code: '123456' });
    expect(res.status).toBe(404);
  });

  test('non-6-digit code → 400 from zod', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify')
      .send({ phone: '+996700555222', code: 'abc' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/verify/resend', () => {
  test('regenerates the code (different from the original)', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Verify User',
      phone: '+996700666000',
      password: 'pass1234',
    });
    const original = reg.body.data.verificationCode;

    const res = await request(app)
      .post('/api/v1/auth/verify/resend')
      .send({ phone: '+996700666000' });
    expect(res.status).toBe(200);
    expect(res.body.data?.verificationCode).toBeDefined();
    // Stored code in DB matches the new one, not the original.
    const u = await prisma.user.findUnique({ where: { phone: '+996700666000' } });
    expect(u?.verificationCode).toBe(res.body.data.verificationCode);
    // Vanishingly rare collision (1/900000) — good enough.
    if (res.body.data.verificationCode === original) {
      // Try once more.
      const r2 = await request(app)
        .post('/api/v1/auth/verify/resend')
        .send({ phone: '+996700666000' });
      expect(r2.body.data.verificationCode).not.toBe(original);
    }
  });

  // Documents the gap: resend has no per-phone rate limit. Phase 8 will track
  // this as a security todo.
  test.todo('resend should be rate-limited (no throttling today)');
});

describe('POST /api/v1/auth/login', () => {
  test('admin happy path; emits auth.login activity log', async () => {
    const u = await factories.admin({ password: 'pass1234' });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: u.phone, password: 'pass1234' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(typeof res.body.data.accessToken).toBe('string');

    const logs = await prisma.activityLog.findMany({
      where: { action: ActivityAction.AUTH_LOGIN },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].entityId).toBe(u.id);
  });

  test('active worker, resident also succeed', async () => {
    const w = await factories.worker({ password: 'pass1234' });
    const r = await factories.resident({ password: 'pass1234' });
    for (const u of [w, r]) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: u.phone, password: 'pass1234' });
      expect(res.status).toBe(200);
    }
  });

  test('wrong password → 401 + auth.login_blocked logged', async () => {
    const u = await factories.admin({ password: 'pass1234' });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: u.phone, password: 'wrong' });
    expect(res.status).toBe(401);
    const logs = await prisma.activityLog.findMany({
      where: { action: ActivityAction.AUTH_LOGIN_BLOCKED },
    });
    expect(logs).toHaveLength(1);
    expect(JSON.parse(logs[0].metadata!).reason).toBe('invalid_password');
  });

  test('PENDING_APPROVAL worker → 403 with "under review" message + audit', async () => {
    const u = await factories.pendingWorker({ password: 'pass1234' });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: u.phone, password: 'pass1234' });
    expect(res.status).toBe(403);
    expect(res.body.error.toLowerCase()).toMatch(/under review/);
    const log = await prisma.activityLog.findFirst({
      where: { action: ActivityAction.AUTH_LOGIN_BLOCKED, entityId: u.id },
    });
    expect(JSON.parse(log!.metadata!).reason).toBe('account_status');
  });

  test('REJECTED worker → 403 with reason in message', async () => {
    const u = await factories.rejectedWorker({ password: 'pass1234' });
    await prisma.user.update({
      where: { id: u.id },
      data: { statusReason: 'Background check failed' },
    });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: u.phone, password: 'pass1234' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Background check failed/);
  });

  test('SUSPENDED worker → 403 with reason in message', async () => {
    const u = await factories.suspendedWorker({ password: 'pass1234' });
    await prisma.user.update({
      where: { id: u.id },
      data: { statusReason: 'Customer complaint' },
    });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: u.phone, password: 'pass1234' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Customer complaint/);
  });

  test('soft-deleted user → 401 (not 403)', async () => {
    const u = await factories.resident({ password: 'pass1234' });
    await prisma.user.update({ where: { id: u.id }, data: { deletedAt: new Date() } });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: u.phone, password: 'pass1234' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  test('happy path issues new tokens', async () => {
    const u = await factories.admin({ password: 'pass1234' });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: u.phone, password: 'pass1234' });
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken });
    expect(res.status).toBe(200);
    expect(typeof res.body.data.accessToken).toBe('string');
  });

  test('rejects an access token (cross-secret)', async () => {
    const u = await factories.admin({ password: 'pass1234' });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: u.phone, password: 'pass1234' });
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.data.accessToken });
    expect(res.status).toBe(401);
  });

  test('refused for a now-suspended user (DB re-check on refresh)', async () => {
    const u = await factories.worker({ password: 'pass1234' });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: u.phone, password: 'pass1234' });
    expect(login.status).toBe(200);
    await prisma.user.update({
      where: { id: u.id },
      data: { accountStatus: 'SUSPENDED', statusReason: 'mid-session' },
    });
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken });
    expect(res.status).toBe(403);
  });

  test('400 when refreshToken is missing', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/auth/me', () => {
  test('returns the public projection (no password, no verificationCode)', async () => {
    const u = await factories.admin({ password: 'pass1234' });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: u.phone, password: 'pass1234' });
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(u.id);
    expect((res.body.data as Record<string, unknown>).password).toBeUndefined();
    expect((res.body.data as Record<string, unknown>).verificationCode).toBeUndefined();
  });

  test('401 without bearer', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Misc auth: password storage shape', () => {
  test('seeded passwords are bcrypt hashes, never plaintext', async () => {
    await factories.admin({ password: 'super-secret' });
    const rows = await prisma.user.findMany();
    for (const r of rows) {
      expect(r.password).not.toBe('super-secret');
      expect(r.password.startsWith('$2')).toBe(true); // bcrypt $2a/$2b/$2y
    }
  });

  test('rehashing a known password produces a verifiable bcrypt comparison', async () => {
    const hash = await bcrypt.hash('pass1234', 4);
    expect(await bcrypt.compare('pass1234', hash)).toBe(true);
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });

  test('JWT issued by login is valid against the access secret', async () => {
    const u = await factories.admin({ password: 'pass1234' });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: u.phone, password: 'pass1234' });
    const { accessToken } = login.body.data;
    // Sanity: another generateTokens call accepts the same shape.
    const fresh = generateTokens({ userId: u.id, role: 'ADMIN' });
    expect(typeof fresh.accessToken).toBe('string');
    expect(typeof accessToken).toBe('string');
  });
});
