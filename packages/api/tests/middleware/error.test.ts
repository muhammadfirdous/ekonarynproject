import express from 'express';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import { AppError, errorHandler } from '../../src/middleware/error';

function appThrowing(thrower: () => Error) {
  const app = express();
  app.get('/probe', (_req, _res, next) => {
    next(thrower());
  });
  app.use(errorHandler);
  return app;
}

describe('middleware/error', () => {
  test('AppError(404, "X") → 404 with { success:false, error:"X" }', async () => {
    const res = await request(appThrowing(() => new AppError('Request not found', 404))).get(
      '/probe',
    );
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: 'Request not found' });
  });

  test('AppError(409, "Conflict") → 409', async () => {
    const res = await request(appThrowing(() => new AppError('Conflict', 409))).get('/probe');
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Conflict');
  });

  test('Generic Error → 500 with "Internal server error" and a single console.error', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await request(appThrowing(() => new Error('boom'))).get('/probe');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, error: 'Internal server error' });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatch(/Unhandled error/);
    spy.mockRestore();
  });

  test('Prisma P2002 (unique constraint) maps to 409 with a friendly error', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.x',
      meta: { target: ['phone'] },
    });
    const res = await request(appThrowing(() => p2002)).get('/probe');
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists|unique/i);
  });

  test('Prisma P2025 (record not found) maps to 404', async () => {
    const p2025 = new Prisma.PrismaClientKnownRequestError(
      'An operation failed because it depends on one or more records that were required but not found',
      { code: 'P2025', clientVersion: '5.x' },
    );
    const res = await request(appThrowing(() => p2025)).get('/probe');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
