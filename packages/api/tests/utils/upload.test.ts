import express from 'express';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { upload } from '../../src/utils/upload';

// Mount the production multer instance on a tiny throwaway app and probe
// fileFilter + size limits + the disk storage config. This is closer to a
// behavior test than a unit test, but it exercises the only thing worth
// caring about: that uploads land where we expect and bad files are rejected.

function buildApp() {
  const app = express();
  app.post('/upload', upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ ok: false });
    res.json({ ok: true, file: { filename: req.file.filename, size: req.file.size } });
  });
  // multer surfaces fileFilter errors as the next() error; convert to 400 here.
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(400).json({ ok: false, error: err.message });
    },
  );
  return app;
}

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
const PNG_PATH = path.resolve(FIXTURES_DIR, 'tiny.png');
const TXT_PATH = path.resolve(FIXTURES_DIR, 'evil.txt');
const BIG_PATH = path.resolve(FIXTURES_DIR, 'too-big.png');

beforeAll(() => {
  if (!fs.existsSync(FIXTURES_DIR)) fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  if (!fs.existsSync(PNG_PATH)) {
    // 1×1 transparent PNG
    fs.writeFileSync(
      PNG_PATH,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9ZGv9YgAAAAASUVORK5CYII=',
        'base64',
      ),
    );
  }
  if (!fs.existsSync(TXT_PATH)) fs.writeFileSync(TXT_PATH, 'not an image');
  if (!fs.existsSync(BIG_PATH)) {
    // ~11 MB of zeroes — exceeds the 10 MB cap.
    fs.writeFileSync(BIG_PATH, Buffer.alloc(11 * 1024 * 1024, 0));
  }
});

afterAll(() => {
  // Big file is bulky; clean it up. Tiny png stays as a shared fixture.
  if (fs.existsSync(BIG_PATH)) fs.unlinkSync(BIG_PATH);
});

describe('utils/upload', () => {
  test('accepts a valid PNG and stores it under uploads/', async () => {
    const app = buildApp();
    const res = await request(app).post('/upload').attach('photo', PNG_PATH);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const filename: string = res.body.file.filename;
    expect(filename).toMatch(/\.png$/i);
    // Must NOT collide with the source filename — multer should generate a unique name.
    expect(filename).not.toBe('tiny.png');

    const onDisk = path.resolve(__dirname, '../../uploads', filename);
    expect(fs.existsSync(onDisk)).toBe(true);
    fs.unlinkSync(onDisk); // clean up
  });

  test('rejects a non-image mime/extension (text/plain)', async () => {
    const app = buildApp();
    // Multer's fileFilter rejection sometimes drops the connection mid-request
    // before the 400 response is fully written. Accept either outcome — a
    // dropped connection IS rejection, the contract is "do not accept".
    let outcome: 'rejected-with-400' | 'connection-dropped' = 'rejected-with-400';
    try {
      const res = await request(app).post('/upload').attach('photo', Buffer.from('not an image'), {
        filename: 'evil.txt',
        contentType: 'text/plain',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Only image files/);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ECONNRESET' || code === 'EPIPE') {
        outcome = 'connection-dropped';
      } else {
        throw err;
      }
    }
    expect(['rejected-with-400', 'connection-dropped']).toContain(outcome);
  });

  test('rejects a file >10 MB (limits.fileSize)', async () => {
    const app = buildApp();
    let outcome: 'rejected-with-400' | 'connection-dropped' = 'rejected-with-400';
    try {
      const res = await request(app).post('/upload').attach('photo', BIG_PATH);
      expect(res.status).toBe(400);
      expect((res.body.error || '').toLowerCase()).toMatch(/file too large|limit_file_size/);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ECONNRESET' || code === 'EPIPE') {
        outcome = 'connection-dropped';
      } else {
        throw err;
      }
    }
    expect(['rejected-with-400', 'connection-dropped']).toContain(outcome);
  });

  test('generated filenames are unique across uploads', async () => {
    const app = buildApp();
    const a = await request(app).post('/upload').attach('photo', PNG_PATH);
    const b = await request(app).post('/upload').attach('photo', PNG_PATH);
    expect(a.body.file.filename).not.toBe(b.body.file.filename);
    // Clean up.
    for (const r of [a, b]) {
      const p = path.resolve(__dirname, '../../uploads', r.body.file.filename);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  });
});
