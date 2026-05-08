import { resetDb } from '../helpers';
import { loginAs } from '../auth';
import { factories } from '../factories';

beforeEach(async () => {
  await resetDb();
});

// Cross-route contract sweep: for every endpoint that has a `validate(schema)`
// middleware, posting an empty body must be rejected by zod with 400.
// Catches the regression where someone forgets to wire validate() (we already
// know one such bug exists in /auth/register/worker — see TEST_PLAN bugs table).
//
// This complements the per-route detail tests in Phase 2 by treating the whole
// surface as a single contract.
describe('Contract — every validated route rejects an empty body with 400', () => {
  const VALIDATED_ENDPOINTS: Array<{
    method: 'post' | 'put';
    path: string;
    auth: 'admin' | 'worker' | 'resident' | 'none';
  }> = [
    { method: 'post', path: '/api/v1/auth/login', auth: 'none' },
    { method: 'post', path: '/api/v1/auth/register', auth: 'none' },
    { method: 'post', path: '/api/v1/auth/register/resident', auth: 'none' },
    { method: 'post', path: '/api/v1/auth/verify', auth: 'none' },
    { method: 'post', path: '/api/v1/auth/verify/resend', auth: 'none' },
    { method: 'post', path: '/api/v1/materials', auth: 'admin' },
    { method: 'post', path: '/api/v1/schedule', auth: 'admin' },
    { method: 'post', path: '/api/v1/financial', auth: 'admin' },
    { method: 'post', path: '/api/v1/requests', auth: 'resident' },
    { method: 'post', path: '/api/v1/collections', auth: 'admin' },
    { method: 'post', path: '/api/v1/trips', auth: 'admin' },
    { method: 'post', path: '/api/v1/routes', auth: 'admin' },
  ];

  test.each(VALIDATED_ENDPOINTS)(
    '$method $path with empty body returns 400',
    async ({ method, path, auth }) => {
      const reqLib = (await import('supertest')).default;
      const app = (await import('../../src/app')).default;

      const builder =
        auth === 'none' ? reqLib(app)[method](path) : (await loginAs(auth)).agent[method](path);
      const r = await builder.send({});
      expect(r.status).toBe(400);
    },
  );

  test('/auth/register/worker with an empty multipart body returns 400 from validate()', async () => {
    const reqLib = (await import('supertest')).default;
    const app = (await import('../../src/app')).default;
    // Use field("name", "x") to force multipart Content-Type even with no other fields.
    const res = await reqLib(app).post('/api/v1/auth/register/worker').field('name', 'x');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});

describe('Contract — analytics & activity reject non-admin', () => {
  const ADMIN_ONLY_GET = [
    '/api/v1/analytics/overview',
    '/api/v1/analytics/monthly',
    '/api/v1/analytics/materials',
    '/api/v1/analytics/workers',
    '/api/v1/financial',
    '/api/v1/financial/summary',
    '/api/v1/activity',
    '/api/v1/users',
    '/api/v1/users/workers/pending',
  ];

  test.each(ADMIN_ONLY_GET)(
    '%s returns 403 for residents (positive admin path tested elsewhere)',
    async (path) => {
      const r = await loginAs('resident');
      const res = await r.agent.get(path);
      expect(res.status).toBe(403);
    },
  );

  test.each(ADMIN_ONLY_GET)('%s returns 403 for workers', async (path) => {
    const w = await loginAs('worker');
    const res = await w.agent.get(path);
    expect(res.status).toBe(403);
  });
});

describe('Contract — public endpoints serve unauth GETs', () => {
  test.each(['/api/v1/materials', '/api/v1/schedule'])(
    'GET %s is reachable without auth',
    async (path) => {
      const reqLib = (await import('supertest')).default;
      const app = (await import('../../src/app')).default;
      // Seed at least one material/schedule so the response isn't empty.
      if (path.endsWith('/materials')) await factories.material();
      if (path.endsWith('/schedule')) {
        // The schedule POST requires admin; create directly.
        const { prisma } = await import('@ekonaryn/db');
        await prisma.schedule.create({
          data: { area: 'Center', dayOfWeek: 1, time: '09:00', active: true },
        });
      }
      const res = await reqLib(app).get(path);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    },
  );
});
