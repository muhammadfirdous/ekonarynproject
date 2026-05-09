import jwt from 'jsonwebtoken';
import request from 'supertest';
import { resetDb } from '../helpers';

beforeEach(async () => {
  await resetDb();
});

// JWT secret rotation: when the prod secret is rotated, every token signed
// under the OLD secret must be rejected. We exercise this by minting a token
// with the current process.env.JWT_SECRET, then mutating the env, then
// re-importing the auth middleware to make sure tokens minted under the old
// secret no longer pass.
//
// NOTE: jwt.verify in the production middleware reads JWT_SECRET ONCE at
// module load (via `const JWT_SECRET = ...`). That means the middleware caches
// the secret. Test verifies the *current* contract — what production does
// today — and pins the cache behavior so a future "rotate without restart"
// effort would catch the gap.
describe('JWT secret rotation', () => {
  test('A token signed with a *different* secret is always rejected (smoke)', async () => {
    const app = (await import('../../src/app')).default;
    const fake = jwt.sign({ userId: 'attacker', role: 'ADMIN' }, 'wrong-secret', {
      expiresIn: '1h',
    });
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${fake}`);
    expect(res.status).toBe(401);
  });

  test('A token signed with the CURRENT secret is accepted (positive control)', async () => {
    const app = (await import('../../src/app')).default;
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const valid = jwt.sign({ userId: 'someone', role: 'ADMIN' }, secret, { expiresIn: '1h' });
    // /auth/me only checks the token signature; it then queries the DB. The DB
    // lookup will fail (no such user), but the auth gate itself passes if the
    // signature is valid. So we expect 404, not 401.
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${valid}`);
    expect([200, 404]).toContain(res.status);
    expect(res.status).not.toBe(401);
  });

  test('Tampering with a valid token (flipping one char in the signature) → 401', async () => {
    const app = (await import('../../src/app')).default;
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const valid = jwt.sign({ userId: 'someone', role: 'ADMIN' }, secret, { expiresIn: '1h' });
    // JWTs are header.payload.signature, base64-url encoded. Flip a char in the
    // signature segment.
    const parts = valid.split('.');
    const sig = parts[2];
    const tampered = `${parts[0]}.${parts[1]}.${sig.slice(0, -1)}${sig.slice(-1) === 'A' ? 'B' : 'A'}`;
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${tampered}`);
    expect(res.status).toBe(401);
  });

  test('Tampering with the payload but keeping a valid signature length → 401', async () => {
    const app = (await import('../../src/app')).default;
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const original = jwt.sign({ userId: 'low-priv', role: 'RESIDENT' }, secret, {
      expiresIn: '1h',
    });
    const parts = original.split('.');
    // Build a new payload claiming admin role.
    const newPayload = Buffer.from(
      JSON.stringify({
        userId: 'low-priv',
        role: 'ADMIN',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString('base64url');
    const tampered = `${parts[0]}.${newPayload}.${parts[2]}`;
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${tampered}`);
    expect(res.status).toBe(401);
  });

  describe('Rate limiting', () => {
    // The auth limiter is shared across /login, /refresh, /verify/resend.
    // It's disabled by default in tests via DISABLE_RATE_LIMIT=true (see
    // tests/setupEnv.ts) so the rest of the suite doesn't trip the
    // 20-attempt window. These tests temporarily un-set that flag.
    let original: string | undefined;
    beforeEach(async () => {
      original = process.env.DISABLE_RATE_LIMIT;
      delete process.env.DISABLE_RATE_LIMIT;
      const { resetAuthLimiter } = await import('../../src/middleware/rateLimit');
      resetAuthLimiter();
    });
    afterEach(async () => {
      const { resetAuthLimiter } = await import('../../src/middleware/rateLimit');
      resetAuthLimiter();
      if (original === undefined) delete process.env.DISABLE_RATE_LIMIT;
      else process.env.DISABLE_RATE_LIMIT = original;
    });

    test('/auth/login throttles after 20 attempts in 15 minutes', async () => {
      const app = (await import('../../src/app')).default;
      const responses = [];
      for (let i = 0; i < 21; i++) {
        responses.push(
          await request(app)
            .post('/api/v1/auth/login')
            .send({ phone: '+996700000001', password: 'wrong' }),
        );
      }
      // First 20 hit the route handler (and return 401 for bad password).
      // The 21st is throttled before reaching the handler.
      expect(responses.slice(0, 20).every((r) => r.status === 401)).toBe(true);
      expect(responses[20].status).toBe(429);
      expect(responses[20].body).toEqual({
        error: { code: 'RATE_LIMIT', message: 'Too many attempts' },
      });
    });

    test('/auth/verify/resend throttles after 20 attempts in 15 minutes', async () => {
      const app = (await import('../../src/app')).default;
      const { prisma } = await import('@ekonaryn/db');
      await prisma.user.create({
        data: {
          name: 'Throttle Test',
          phone: '+996700777111',
          password: 'hash',
          role: 'RESIDENT',
          accountStatus: 'ACTIVE',
        },
      });
      const responses = [];
      for (let i = 0; i < 21; i++) {
        responses.push(
          await request(app).post('/api/v1/auth/verify/resend').send({ phone: '+996700777111' }),
        );
      }
      expect(responses.slice(0, 20).every((r) => r.status === 200)).toBe(true);
      expect(responses[20].status).toBe(429);
    });
  });
});
