import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { prisma } from '@ekonaryn/db';
import app from '../src/app';
import { resetDb } from './helpers';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
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

// Snapshot the env so each describe block can flip SKIP_PHONE_VERIFICATION
// without leaking into siblings.
const ORIGINAL_SKIP = process.env.SKIP_PHONE_VERIFICATION;
afterAll(() => {
  if (ORIGINAL_SKIP === undefined) delete process.env.SKIP_PHONE_VERIFICATION;
  else process.env.SKIP_PHONE_VERIFICATION = ORIGINAL_SKIP;
});

describe('SKIP_PHONE_VERIFICATION=true', () => {
  beforeAll(() => {
    process.env.SKIP_PHONE_VERIFICATION = 'true';
  });
  afterAll(() => {
    delete process.env.SKIP_PHONE_VERIFICATION;
  });

  test('POST /auth/register/resident: account is auto-verified, no code generated, no code in response', async () => {
    const res = await request(app).post('/api/v1/auth/register/resident').send({
      name: 'Skip Resident',
      phone: '+996700990001',
      password: 'pass1234',
      address: 'Center',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.verificationCode).toBeUndefined();

    const user = await prisma.user.findUnique({ where: { phone: '+996700990001' } });
    expect(user).not.toBeNull();
    expect(user!.phoneVerifiedAt).not.toBeNull();
    expect(user!.verificationCode).toBeNull();
    expect(user!.verificationCodeExpiresAt).toBeNull();
  });

  test('POST /auth/register: legacy resident path also honors the gate', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Legacy',
      phone: '+996700990002',
      password: 'pass1234',
      address: 'Center',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.verificationCode).toBeUndefined();

    const user = await prisma.user.findUnique({ where: { phone: '+996700990002' } });
    expect(user!.phoneVerifiedAt).not.toBeNull();
    expect(user!.verificationCode).toBeNull();
  });

  test('POST /auth/register/worker: worker is phone-verified but accountStatus stays PENDING_APPROVAL', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/worker')
      .field('name', 'Skip Worker')
      .field('phone', '+996700990003')
      .field('password', 'pass1234')
      .field('idNumber', 'SKIP-001')
      .field('serviceAreas', JSON.stringify(['Center']))
      .field('vehicleType', 'pickup')
      .field('vehiclePlate', '01KGSKP01')
      .field('vehicleCapacityKg', '500')
      .attach('idDocument', PNG_PATH);

    expect(res.status).toBe(201);
    expect(res.body.data.verificationCode).toBeUndefined();

    const user = await prisma.user.findUnique({ where: { phone: '+996700990003' } });
    expect(user!.phoneVerifiedAt).not.toBeNull();
    expect(user!.verificationCode).toBeNull();
    // Worker approval is INDEPENDENT of phone verification.
    expect(user!.accountStatus).toBe('PENDING_APPROVAL');
  });

  test('POST /auth/verify/resend → 400 VERIFICATION_DISABLED', async () => {
    // Pre-create a user so the handler doesn't even need to look one up — the
    // gate fires before the lookup.
    await prisma.user.create({
      data: {
        name: 'Already Verified',
        phone: '+996700990004',
        password: 'hash',
        role: 'RESIDENT',
        accountStatus: 'ACTIVE',
      },
    });
    const res = await request(app)
      .post('/api/v1/auth/verify/resend')
      .send({ phone: '+996700990004' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VERIFICATION_DISABLED');
  });

  test('POST /auth/verify still completes for accounts that have an in-flight code', async () => {
    // Simulate an account that registered before the env was flipped — it has
    // a code stored that they never had a chance to redeem.
    const code = '654321';
    await prisma.user.create({
      data: {
        name: 'In-flight',
        phone: '+996700990005',
        password: 'hash',
        role: 'RESIDENT',
        accountStatus: 'ACTIVE',
        verificationCode: code,
        verificationCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    const res = await request(app)
      .post('/api/v1/auth/verify')
      .send({ phone: '+996700990005', code });
    expect(res.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { phone: '+996700990005' } });
    expect(user!.phoneVerifiedAt).not.toBeNull();
    expect(user!.verificationCode).toBeNull();
  });
});

describe('SKIP_PHONE_VERIFICATION=false (default)', () => {
  beforeAll(() => {
    delete process.env.SKIP_PHONE_VERIFICATION;
  });

  test('POST /auth/register/resident: code is generated, phoneVerifiedAt remains null', async () => {
    const res = await request(app).post('/api/v1/auth/register/resident').send({
      name: 'Normal Resident',
      phone: '+996700991001',
      password: 'pass1234',
      address: 'Center',
    });
    expect(res.status).toBe(201);
    // setupEnv.ts → NODE_ENV='test' → shouldExposeCode() returns true →
    // verificationCode appears in response for QA convenience.
    expect(res.body.data.verificationCode).toBeDefined();

    const user = await prisma.user.findUnique({ where: { phone: '+996700991001' } });
    expect(user!.phoneVerifiedAt).toBeNull();
    expect(user!.verificationCode).not.toBeNull();
    expect(user!.verificationCodeExpiresAt).not.toBeNull();
  });

  test('POST /auth/verify/resend: regenerates the code (200)', async () => {
    await prisma.user.create({
      data: {
        name: 'Resender',
        phone: '+996700991002',
        password: 'hash',
        role: 'RESIDENT',
        accountStatus: 'ACTIVE',
        verificationCode: 'OLDCODE',
        verificationCodeExpiresAt: new Date(Date.now() + 60_000),
      },
    });
    const res = await request(app)
      .post('/api/v1/auth/verify/resend')
      .send({ phone: '+996700991002' });
    expect(res.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { phone: '+996700991002' } });
    expect(user!.verificationCode).not.toBe('OLDCODE');
  });
});
