import request from 'supertest';
import app from '../../src/app';
import { prisma } from '@ekonaryn/db';
import { factories } from '../factories';
import { loginAs } from '../auth';
import { resetDb } from '../helpers';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Permission matrix: a few representative routes × every role × anonymous.
// Outcome map below states the EXPECTED status code per cell. We mostly check
// "did the gate close" (401/403) vs. "the gate let us through" (any 2xx). For
// gate-passes we also accept 4xx of a different flavor (e.g. 404 because the
// resource id was random) — what matters is the absence of 401/403.

type RoleOrAnon = 'admin' | 'worker' | 'resident' | 'anon';

interface Route {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  // What we expect for this role.
  expect: Record<RoleOrAnon, 'gate-closed' | 'gate-open'>;
}

const ROUTES: Route[] = [
  // Public reads.
  {
    method: 'get',
    path: '/api/v1/materials',
    expect: { admin: 'gate-open', worker: 'gate-open', resident: 'gate-open', anon: 'gate-open' },
  },
  {
    method: 'get',
    path: '/api/v1/schedule',
    expect: { admin: 'gate-open', worker: 'gate-open', resident: 'gate-open', anon: 'gate-open' },
  },

  // Admin-only.
  {
    method: 'get',
    path: '/api/v1/users',
    expect: {
      admin: 'gate-open',
      worker: 'gate-closed',
      resident: 'gate-closed',
      anon: 'gate-closed',
    },
  },
  {
    method: 'get',
    path: '/api/v1/users/workers/pending',
    expect: {
      admin: 'gate-open',
      worker: 'gate-closed',
      resident: 'gate-closed',
      anon: 'gate-closed',
    },
  },
  {
    method: 'get',
    path: '/api/v1/financial',
    expect: {
      admin: 'gate-open',
      worker: 'gate-closed',
      resident: 'gate-closed',
      anon: 'gate-closed',
    },
  },
  {
    method: 'get',
    path: '/api/v1/analytics/overview',
    expect: {
      admin: 'gate-open',
      worker: 'gate-closed',
      resident: 'gate-closed',
      anon: 'gate-closed',
    },
  },
  {
    method: 'get',
    path: '/api/v1/activity',
    expect: {
      admin: 'gate-open',
      worker: 'gate-closed',
      resident: 'gate-closed',
      anon: 'gate-closed',
    },
  },

  // Auth required for any role.
  {
    method: 'get',
    path: '/api/v1/auth/me',
    expect: { admin: 'gate-open', worker: 'gate-open', resident: 'gate-open', anon: 'gate-closed' },
  },

  // Resident-create.
  {
    method: 'post',
    path: '/api/v1/requests',
    expect: {
      admin: 'gate-closed',
      worker: 'gate-closed',
      resident: 'gate-open',
      anon: 'gate-closed',
    },
  },
];

async function call(method: Route['method'], path: string, role: RoleOrAnon) {
  const req = request(app)[method](path);
  if (role === 'anon') return req;
  const { accessToken } = await loginAs(role);
  return req.set('Authorization', `Bearer ${accessToken}`);
}

function isGateClosed(status: number) {
  return status === 401 || status === 403;
}

describe('Cross-cutting: permission matrix (role × route)', () => {
  for (const r of ROUTES) {
    for (const role of ['admin', 'worker', 'resident', 'anon'] as const) {
      const expectation = r.expect[role];
      test(`${r.method.toUpperCase()} ${r.path} as ${role} → ${expectation}`, async () => {
        const res = await call(r.method, r.path, role);
        if (expectation === 'gate-closed') {
          expect(isGateClosed(res.status)).toBe(true);
        } else {
          expect(isGateClosed(res.status)).toBe(false);
        }
      });
    }
  }
});
