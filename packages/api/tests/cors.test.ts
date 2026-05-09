import request from 'supertest';
import app from '../src/app';

// CORS_ORIGINS is set in tests/setupEnv.ts to
// 'http://localhost:3000,http://localhost:3001' before app.ts loads.
const ALLOWED = 'http://localhost:3000';
const FORBIDDEN = 'https://evil.example.com';

describe('CORS allowlist', () => {
  test('allowed Origin → response carries Access-Control-Allow-Origin', async () => {
    const res = await request(app).get('/health').set('Origin', ALLOWED);
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
  });

  test('preflight (OPTIONS) for an allowed Origin succeeds with 204 + headers', async () => {
    const res = await request(app)
      .options('/api/v1/auth/login')
      .set('Origin', ALLOWED)
      .set('Access-Control-Request-Method', 'POST');
    expect(res.status).toBeLessThan(300);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
  });

  test('forbidden Origin → no Access-Control-Allow-Origin header', async () => {
    const res = await request(app).get('/health').set('Origin', FORBIDDEN);
    // The cors package forwards the rejection error to the central errorHandler,
    // which today maps unknown errors to 500.
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.status).toBe(500);
  });

  test('no Origin header (mobile / curl / S2S) → request passes through', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'ekonaryn-api' });
  });
});
