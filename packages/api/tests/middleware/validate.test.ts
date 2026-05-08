import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validate } from '../../src/middleware/validate';
import { errorHandler } from '../../src/middleware/error';

function appWith(schema: z.ZodSchema) {
  const app = express();
  app.use(express.json());
  app.post('/probe', validate(schema), (req, res) => res.json({ ok: true, body: req.body }));
  app.use(errorHandler);
  return app;
}

describe('middleware/validate', () => {
  test('valid body passes through and is replaced with the parsed value', async () => {
    const schema = z.object({ name: z.string(), age: z.number().int() });
    const app = appWith(schema);
    const res = await request(app).post('/probe').send({ name: 'Tom', age: 30 });
    expect(res.status).toBe(200);
    expect(res.body.body).toEqual({ name: 'Tom', age: 30 });
  });

  test('invalid body returns 400 with details: [{field, message}]', async () => {
    const schema = z.object({ name: z.string().min(2), email: z.string().email() });
    const app = appWith(schema);
    const res = await request(app).post('/probe').send({ name: '', email: 'not-email' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation failed');
    expect(Array.isArray(res.body.details)).toBe(true);
    const fields = res.body.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email']));
    for (const d of res.body.details) {
      expect(typeof d.message).toBe('string');
    }
  });

  test('nested path is reported with dot notation', async () => {
    const schema = z.object({ user: z.object({ phone: z.string().min(5) }) });
    const app = appWith(schema);
    const res = await request(app)
      .post('/probe')
      .send({ user: { phone: 'no' } });
    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('user.phone');
  });

  test('unknown keys are stripped by default (zod default behavior)', async () => {
    const schema = z.object({ name: z.string() });
    const app = appWith(schema);
    const res = await request(app).post('/probe').send({ name: 'Tom', extra: 'ignored' });
    expect(res.status).toBe(200);
    // Default zod parse drops unknown keys when no `passthrough` is requested.
    expect(res.body.body).toEqual({ name: 'Tom' });
  });

  test('strict() schemas reject unknown keys with 400', async () => {
    const schema = z.object({ name: z.string() }).strict();
    const app = appWith(schema);
    const res = await request(app).post('/probe').send({ name: 'Tom', extra: 'no' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});
