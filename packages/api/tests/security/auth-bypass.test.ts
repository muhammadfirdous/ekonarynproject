import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../../src/app';
import { resetDb } from '../helpers';
import { loginAs } from '../auth';

const PROTECTED_ROUTES: Array<{ method: 'get' | 'post' | 'put' | 'delete'; path: string }> = [
  // users
  { method: 'get', path: '/api/v1/users' },
  { method: 'get', path: '/api/v1/users/workers/pending' },
  { method: 'get', path: '/api/v1/users/00000000-0000-0000-0000-000000000000' },
  { method: 'put', path: '/api/v1/users/00000000-0000-0000-0000-000000000000' },
  { method: 'delete', path: '/api/v1/users/00000000-0000-0000-0000-000000000000' },
  // requests
  { method: 'get', path: '/api/v1/requests' },
  { method: 'get', path: '/api/v1/requests/00000000-0000-0000-0000-000000000000' },
  { method: 'post', path: '/api/v1/requests' },
  { method: 'put', path: '/api/v1/requests/00000000-0000-0000-0000-000000000000/status' },
  { method: 'post', path: '/api/v1/requests/00000000-0000-0000-0000-000000000000/assign' },
  { method: 'delete', path: '/api/v1/requests/00000000-0000-0000-0000-000000000000' },
  // collections
  { method: 'get', path: '/api/v1/collections' },
  { method: 'post', path: '/api/v1/collections' },
  // trips
  { method: 'get', path: '/api/v1/trips' },
  { method: 'post', path: '/api/v1/trips' },
  // routes
  { method: 'get', path: '/api/v1/routes' },
  { method: 'post', path: '/api/v1/routes' },
  // schedule (admin write)
  { method: 'post', path: '/api/v1/schedule' },
  // materials (admin write)
  { method: 'post', path: '/api/v1/materials' },
  { method: 'put', path: '/api/v1/materials/00000000-0000-0000-0000-000000000000' },
  { method: 'delete', path: '/api/v1/materials/00000000-0000-0000-0000-000000000000' },
  // financial
  { method: 'get', path: '/api/v1/financial' },
  { method: 'post', path: '/api/v1/financial' },
  // analytics
  { method: 'get', path: '/api/v1/analytics/overview' },
  { method: 'get', path: '/api/v1/analytics/monthly' },
  { method: 'get', path: '/api/v1/analytics/materials' },
  { method: 'get', path: '/api/v1/analytics/workers' },
  // activity
  { method: 'get', path: '/api/v1/activity' },
  // auth/me
  { method: 'get', path: '/api/v1/auth/me' },
];

beforeEach(async () => {
  await resetDb();
});

describe('Auth bypass matrix', () => {
  describe('No Authorization header → 401', () => {
    test.each(PROTECTED_ROUTES)('$method $path returns 401', async ({ method, path }) => {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Malformed Authorization header → 401', () => {
    test.each([
      'Bearer', // no token
      'Bearer ', // empty token
      'Bearer not-a-jwt', // gibberish
      'Basic dXNlcjpwYXNz', // wrong scheme
      'bearer eyJ.foo.bar', // wrong-case scheme
      'eyJ.eyJ.x', // raw JWT, no scheme
    ])('header "%s" returns 401', async (header) => {
      const res = await request(app).get('/api/v1/users').set('Authorization', header);
      expect(res.status).toBe(401);
    });
  });

  test('Token signed with the wrong secret is rejected', async () => {
    // Mint a token that LOOKS valid but is signed with a non-prod secret.
    const forged = jwt.sign(
      { userId: 'attacker', role: 'ADMIN' },
      'definitely-not-the-real-secret',
      { expiresIn: '1h' },
    );
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test('Token signed with the right secret BUT expired is rejected', async () => {
    const expired = jwt.sign(
      { userId: 'someone', role: 'ADMIN' },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '-1h' },
    );
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  describe('Authenticated but wrong role (resident hits admin-only) → 403', () => {
    const ADMIN_ONLY: Array<{ method: 'get' | 'post' | 'put' | 'delete'; path: string }> = [
      { method: 'get', path: '/api/v1/users' },
      { method: 'get', path: '/api/v1/users/workers/pending' },
      { method: 'get', path: '/api/v1/analytics/overview' },
      { method: 'get', path: '/api/v1/financial' },
      { method: 'post', path: '/api/v1/materials' },
      { method: 'post', path: '/api/v1/schedule' },
      { method: 'get', path: '/api/v1/activity' },
    ];

    test.each(ADMIN_ONLY)('$method $path is forbidden for residents', async ({ method, path }) => {
      const { agent } = await loginAs('resident');
      const res = await agent[method](path);
      // 403 = authorize(); some paths get 400 if validate runs first on POSTs.
      // The point is they're NOT 200 / 201 / 2xx.
      expect([400, 403]).toContain(res.status);
    });
  });
});
