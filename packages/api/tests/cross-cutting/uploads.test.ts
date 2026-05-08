import path from 'path';
import fs from 'fs';
import request from 'supertest';
import app from '../../src/app';

// Static /uploads middleware is mounted in src/app.ts:16.
// We test with a manually-placed file (not a multer upload, to keep this test
// focused on the static handler) and ensure that path traversal is blocked.

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const ASSET = 'crossCuttingFixture.txt';
const ASSET_PATH = path.join(UPLOADS_DIR, ASSET);

beforeAll(() => {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.writeFileSync(ASSET_PATH, 'hello uploads');
});

afterAll(() => {
  if (fs.existsSync(ASSET_PATH)) fs.unlinkSync(ASSET_PATH);
});

describe('Cross-cutting: /uploads static + traversal block', () => {
  test('a real uploaded file is reachable', async () => {
    const res = await request(app).get(`/uploads/${ASSET}`);
    expect(res.status).toBe(200);
    expect(res.text).toBe('hello uploads');
  });

  test('missing file → 404', async () => {
    const res = await request(app).get('/uploads/does-not-exist.png');
    expect(res.status).toBe(404);
  });

  test('path traversal attempts are blocked', async () => {
    // express.static normalizes the path and refuses to escape the served root.
    const attempts = [
      '/uploads/../package.json',
      '/uploads/..%2Fpackage.json',
      '/uploads/..%2F..%2Fpackage.json',
      '/uploads/%2e%2e/package.json',
    ];
    for (const url of attempts) {
      const res = await request(app).get(url);
      expect([400, 403, 404]).toContain(res.status);
      // Whatever code it returns, the body must NOT include the package.json contents.
      expect(res.text || '').not.toMatch(/"name"\s*:\s*"@ekonaryn\/api"/);
    }
  });
});
