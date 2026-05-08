import request from 'supertest';
import app from '../../src/app';

// app.ts mounts helmet() and cors(). We just check the resulting headers are
// present so a regression that drops the middleware can't sneak through.
describe('Cross-cutting: security and CORS headers', () => {
  test('helmet headers are set on a public response', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    // A subset of helmet's defaults.
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-download-options']).toBe('noopen');
    expect(res.headers['strict-transport-security']).toMatch(/max-age=/);
  });

  test('CORS allows arbitrary origins (current open default — see TEST_PLAN risks)', async () => {
    const res = await request(app)
      .options('/api/v1/materials')
      .set('Origin', 'https://random.example.com')
      .set('Access-Control-Request-Method', 'GET');
    // cors() defaults to mirroring the Origin / wildcarding everything.
    // We don't assert a specific value — only that the header is present.
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});
