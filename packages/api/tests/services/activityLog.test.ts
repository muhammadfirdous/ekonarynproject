import type { Request } from 'express';
import { prisma } from '@ekonaryn/db';
import { logActivity } from '../../src/services/activityLog';
import { resetDb } from '../helpers';

// Cascade-clean in FK order so leftover rows from a previous file's tests don't
// block our writes (or muddy our findMany assertions).
beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
});

function fakeRequest(
  overrides: Partial<{
    userId: string;
    role: string;
    ip: string;
    userAgent: string;
    forwardedFor: string;
  }> = {},
): Request {
  // Minimal Express.Request shape that exercises the IP/UA extraction in
  // contextFromRequest(). Only the properties the function reads are present.
  const headers: Record<string, string> = {};
  if (overrides.userAgent) headers['user-agent'] = overrides.userAgent;
  if (overrides.forwardedFor) headers['x-forwarded-for'] = overrides.forwardedFor;
  return {
    headers,
    socket: { remoteAddress: overrides.ip ?? '127.0.0.1' } as never,
    user: overrides.userId
      ? { userId: overrides.userId, role: overrides.role ?? 'ADMIN' }
      : undefined,
  } as unknown as Request;
}

describe('services/activityLog', () => {
  test('writes a row from a LogContext', async () => {
    await logActivity(
      { actorId: 'actor-1', actorRole: 'WORKER', ipAddress: '10.0.0.1', userAgent: 'jest/1' },
      'worker.registered',
      'user',
      'entity-1',
      { phone: '+996700000001' },
    );

    const rows = await prisma.activityLog.findMany();
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r).toMatchObject({
      actorId: 'actor-1',
      actorRole: 'WORKER',
      action: 'worker.registered',
      entityType: 'user',
      entityId: 'entity-1',
      ipAddress: '10.0.0.1',
      userAgent: 'jest/1',
    });
    expect(JSON.parse(r.metadata!)).toEqual({ phone: '+996700000001' });
  });

  test('writes a row from an Express Request: extracts user, IP, UA', async () => {
    const req = fakeRequest({
      userId: 'u-1',
      role: 'ADMIN',
      ip: '203.0.113.5',
      userAgent: 'curl/8.0',
    });
    await logActivity(req, 'auth.login', 'user', 'u-1');
    const r = (await prisma.activityLog.findMany())[0];
    expect(r).toMatchObject({
      actorId: 'u-1',
      actorRole: 'ADMIN',
      action: 'auth.login',
      entityType: 'user',
      entityId: 'u-1',
      ipAddress: '203.0.113.5',
      userAgent: 'curl/8.0',
    });
  });

  test('prefers the first x-forwarded-for value over socket.remoteAddress', async () => {
    const req = fakeRequest({
      userId: 'u-2',
      role: 'RESIDENT',
      ip: '127.0.0.1',
      forwardedFor: '198.51.100.10, 10.0.0.1',
    });
    await logActivity(req, 'auth.login', 'user', 'u-2');
    const r = (await prisma.activityLog.findMany())[0];
    expect(r.ipAddress).toBe('198.51.100.10');
  });

  test('falls back to nulls when context is undefined', async () => {
    await logActivity(undefined, 'request.created', 'pickup_request', 'r-1');
    const r = (await prisma.activityLog.findMany())[0];
    expect(r.actorId).toBeNull();
    expect(r.actorRole).toBeNull();
    expect(r.ipAddress).toBeNull();
    expect(r.userAgent).toBeNull();
  });

  test('serializes nested object metadata as JSON', async () => {
    const meta = {
      before: { status: 'pending' },
      after: { status: 'assigned', assignedWorkerId: 'w-1' },
      reason: null,
    };
    await logActivity(undefined, 'order.assigned', 'pickup_request', 'r-1', meta);
    const r = (await prisma.activityLog.findMany())[0];
    expect(JSON.parse(r.metadata!)).toEqual(meta);
  });

  test('omits metadata when undefined', async () => {
    await logActivity(undefined, 'auth.login', 'user', 'u-1');
    const r = (await prisma.activityLog.findMany())[0];
    expect(r.metadata).toBeNull();
  });

  test('falls back to null IP when req has no socket and no x-forwarded-for', async () => {
    // Hits the `req.socket?.remoteAddress` short-circuit branch.
    const req = { headers: {} } as unknown as Request;
    await logActivity(req, 'auth.login', 'user', 'u-no-ip');
    const r = (await prisma.activityLog.findMany())[0];
    expect(r.ipAddress).toBeNull();
  });

  test('null entityId is persisted as null', async () => {
    await logActivity(undefined, 'auth.login', 'user', null);
    const r = (await prisma.activityLog.findMany())[0];
    expect(r.entityId).toBeNull();
  });

  test('actorRole reflects the supplied context, not a JWT', async () => {
    // Even if req.user.role exists, an explicit LogContext wins.
    await logActivity(
      { actorId: 'u-1', actorRole: 'IMPERSONATOR' },
      'order.assigned',
      'pickup_request',
      'r-1',
    );
    const r = (await prisma.activityLog.findMany())[0];
    expect(r.actorRole).toBe('IMPERSONATOR');
  });

  test('swallows Prisma write errors and console.errors once (does NOT throw)', async () => {
    const original = prisma.activityLog.create;
    const spyErr = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    // Force the write to fail.
    (prisma.activityLog as unknown as { create: jest.Mock }).create = jest.fn(() =>
      Promise.reject(new Error('db down')),
    );

    await expect(
      logActivity(undefined, 'auth.login_blocked', 'user', 'u-1', { reason: 'invalid_password' }),
    ).resolves.toBeUndefined();
    expect(spyErr).toHaveBeenCalledTimes(1);
    expect(spyErr.mock.calls[0][0]).toMatch(/activityLog: failed to write entry/);

    // Restore.
    (prisma.activityLog as unknown as { create: typeof original }).create = original;
    spyErr.mockRestore();
  });
});
