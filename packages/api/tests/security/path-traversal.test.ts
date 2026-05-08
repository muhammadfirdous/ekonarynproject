import request from 'supertest';
import app from '../../src/app';
import { resetDb } from '../helpers';

beforeEach(async () => {
  await resetDb();
});

// /uploads is served via express.static. Express normalizes the path before
// handing to send-static, so traversal attempts that escape the root directory
// resolve to a 404 rather than serving an unrelated file.
describe('Path traversal — /uploads static handler', () => {
  test.each([
    '/uploads/../package.json',
    '/uploads/..%2fpackage.json',
    '/uploads/%2e%2e/package.json',
    '/uploads/....//package.json',
    '/uploads/%252e%252e/package.json', // double-encoded
  ])('rejects traversal attempt %s', async (target) => {
    const res = await request(app).get(target);
    // Either Express normalizes to 404 or serves "not found". The contract
    // is: the response body must NOT contain anything from package.json.
    expect(res.status).not.toBe(200);
    if (res.text) {
      expect(res.text).not.toMatch(/"name":\s*"@ekonaryn\/api"/);
    }
  });

  test('Non-existent file in /uploads returns 404, not the index of the directory', async () => {
    const res = await request(app).get('/uploads/never-existed.png');
    expect(res.status).toBe(404);
  });

  test('Bare /uploads returns 404 (no directory listing)', async () => {
    const res = await request(app).get('/uploads/');
    // Different express-static versions return either 404 or a 301 redirect
    // appending a slash; neither is a directory listing.
    expect([301, 404]).toContain(res.status);
    if (res.text) {
      expect(res.text.toLowerCase()).not.toMatch(/<html.*<a/);
    }
  });
});
