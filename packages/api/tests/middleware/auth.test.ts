import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authenticate, authorize, requireActiveAccount } from '../../src/middleware/auth';
import { errorHandler } from '../../src/middleware/error';
import { factories } from '../factories';
import { prisma } from '@ekonaryn/db';
import { generateTokens } from '../../src/utils/tokens';
import { resetDb } from '../helpers';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

function tinyApp(handlers: ((req: Request, res: Response, next: NextFunction) => unknown)[]) {
  const app = express();
  app.use(express.json());
  app.get('/probe', ...handlers, (req: Request, res: Response) =>
    res.json({ ok: true, user: req.user ?? null }),
  );
  app.use(errorHandler);
  return app;
}

const ACCESS_SECRET = process.env.JWT_SECRET ?? 'test-secret';

describe('middleware/authenticate', () => {
  test('missing header → 401', async () => {
    const app = tinyApp([authenticate]);
    const res = await request(app).get('/probe');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: 'Authentication required' });
  });

  test('malformed header (not Bearer) → 401', async () => {
    const app = tinyApp([authenticate]);
    const res = await request(app).get('/probe').set('Authorization', 'Token abc');
    expect(res.status).toBe(401);
  });

  test('garbage token → 401 (Invalid or expired token)', async () => {
    const app = tinyApp([authenticate]);
    const res = await request(app).get('/probe').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid or expired token/);
  });

  test('valid token → req.user populated and next() runs', async () => {
    const app = tinyApp([authenticate]);
    const { accessToken } = generateTokens({
      userId: 'u-1',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
    });
    const res = await request(app).get('/probe').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ userId: 'u-1', role: 'ADMIN', accountStatus: 'ACTIVE' });
  });

  test('expired token → 401', async () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    const expired = jwt.sign(
      { userId: 'u-1', role: 'ADMIN', exp: past, iat: past - 60 },
      ACCESS_SECRET,
    );
    const app = tinyApp([authenticate]);
    const res = await request(app).get('/probe').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });
});

describe('middleware/authorize', () => {
  function appAs(role: string, ...allowed: string[]) {
    const stub = (req: Request, _res: Response, next: NextFunction) => {
      req.user = { userId: 'u-1', role };
      next();
    };
    return tinyApp([stub, authorize(...allowed)]);
  }

  test('rejects when role not in allowed list (403)', async () => {
    const res = await request(appAs('RESIDENT', 'ADMIN')).get('/probe');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Insufficient permissions');
  });

  test('accepts when role matches', async () => {
    const res = await request(appAs('ADMIN', 'ADMIN')).get('/probe');
    expect(res.status).toBe(200);
  });

  test('multi-role: authorize("ADMIN","WORKER") accepts WORKER', async () => {
    const res = await request(appAs('WORKER', 'ADMIN', 'WORKER')).get('/probe');
    expect(res.status).toBe(200);
  });

  test('rejects when authenticate did not run (no req.user) → 401', async () => {
    // Mount authorize without authenticate — should fail-closed at 401.
    const app = tinyApp([authorize('ADMIN')]);
    const res = await request(app).get('/probe');
    expect(res.status).toBe(401);
  });
});

describe('middleware/requireActiveAccount', () => {
  test('401 when no req.user', async () => {
    const app = tinyApp([requireActiveAccount]);
    const res = await request(app).get('/probe');
    expect(res.status).toBe(401);
  });

  test('200 when DB user is ACTIVE', async () => {
    const u = await factories.admin();
    const stub = (req: Request, _res: Response, next: NextFunction) => {
      req.user = { userId: u.id, role: 'ADMIN' };
      next();
    };
    const app = tinyApp([stub, requireActiveAccount]);
    const res = await request(app).get('/probe');
    expect(res.status).toBe(200);
    expect(res.body.user.accountStatus).toBe('ACTIVE');
  });

  test('403 when DB user is SUSPENDED (token still valid)', async () => {
    const u = await factories.suspendedWorker();
    const stub = (req: Request, _res: Response, next: NextFunction) => {
      req.user = { userId: u.id, role: 'WORKER' };
      next();
    };
    const app = tinyApp([stub, requireActiveAccount]);
    const res = await request(app).get('/probe');
    expect(res.status).toBe(403);
    expect(res.body.error.toLowerCase()).toMatch(/suspended/);
  });

  test('403 when DB user is PENDING_APPROVAL', async () => {
    const u = await factories.pendingWorker();
    const stub = (req: Request, _res: Response, next: NextFunction) => {
      req.user = { userId: u.id, role: 'WORKER' };
      next();
    };
    const app = tinyApp([stub, requireActiveAccount]);
    const res = await request(app).get('/probe');
    expect(res.status).toBe(403);
    expect(res.body.error.toLowerCase()).toMatch(/pending approval/);
  });

  test('401 when user has been soft-deleted', async () => {
    const u = await factories.resident();
    await prisma.user.update({ where: { id: u.id }, data: { deletedAt: new Date() } });
    const stub = (req: Request, _res: Response, next: NextFunction) => {
      req.user = { userId: u.id, role: 'RESIDENT' };
      next();
    };
    const app = tinyApp([stub, requireActiveAccount]);
    const res = await request(app).get('/probe');
    expect(res.status).toBe(401);
  });

  test('a token issued before suspension stops working immediately on the next request', async () => {
    // Important behavior: status is re-read from DB on every request, not pulled from JWT.
    const u = await factories.worker();
    const { accessToken } = generateTokens({
      userId: u.id,
      role: 'WORKER',
      accountStatus: 'ACTIVE', // <-- token says ACTIVE
    });
    // Suspend the user *after* issuing the token.
    await prisma.user.update({
      where: { id: u.id },
      data: { accountStatus: 'SUSPENDED', statusReason: 'mid-session policy violation' },
    });

    const app = tinyApp([authenticate, requireActiveAccount]);
    const res = await request(app).get('/probe').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });
});
