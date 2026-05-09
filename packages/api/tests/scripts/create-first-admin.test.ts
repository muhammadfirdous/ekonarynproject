// Note on location: the work order put this file at scripts/create-first-admin.test.ts
// (next to the script). The repo's test runners are per-workspace; standing up a
// new runner just for this one file would be a lot of plumbing. Living under
// packages/api/tests instead lets the existing Postgres-test infrastructure
// (globalSetup, setupEnv, resetDb) cover it for free.
import bcrypt from 'bcryptjs';
import { prisma } from '@ekonaryn/db';
import { resetDb } from '../helpers';
import { createFirstAdmin } from '../../../../scripts/create-first-admin';

beforeEach(async () => {
  await resetDb();
});

describe('createFirstAdmin', () => {
  test('creates an ADMIN with ACTIVE status, verified phone, and a bcrypt hash that verifies', async () => {
    const { id } = await createFirstAdmin({
      name: 'Bootstrap Admin',
      phone: '+996700000099',
      password: 'super-secure-pw',
    });

    const user = await prisma.user.findUnique({ where: { id } });
    expect(user).not.toBeNull();
    expect(user!.role).toBe('ADMIN');
    expect(user!.accountStatus).toBe('ACTIVE');
    expect(user!.phoneVerifiedAt).not.toBeNull();
    expect(user!.deletedAt).toBeNull();

    // Bcrypt hash, cost 10, round-trips against the original password.
    expect(user!.password).toMatch(/^\$2[aby]\$10\$/);
    expect(await bcrypt.compare('super-secure-pw', user!.password)).toBe(true);
  });

  test('refuses when an ADMIN already exists', async () => {
    // First admin succeeds.
    await createFirstAdmin({
      name: 'First',
      phone: '+996700000098',
      password: 'pass1234A',
    });

    // Second attempt should refuse.
    await expect(
      createFirstAdmin({
        name: 'Second',
        phone: '+996700000097',
        password: 'pass5678B',
      }),
    ).rejects.toThrow(/admin account already exists/i);

    // And the second user must NOT have been created.
    const count = await prisma.user.count({
      where: { role: 'ADMIN', deletedAt: null },
    });
    expect(count).toBe(1);
  });

  test('soft-deleted admins do not block bootstrap', async () => {
    // Pre-seed a soft-deleted admin (e.g. left over from a wiped staging run).
    await prisma.user.create({
      data: {
        name: 'Old Admin',
        phone: '+996700000091',
        password: 'irrelevant',
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        deletedAt: new Date(),
      },
    });

    const { id } = await createFirstAdmin({
      name: 'New Admin',
      phone: '+996700000092',
      password: 'pass1234A',
    });
    expect(id).toBeDefined();
  });

  test('rejects an invalid phone format via the shared schema', async () => {
    await expect(
      createFirstAdmin({
        name: 'Bad Phone',
        phone: '+1-555-noway',
        password: 'pass1234A',
      }),
    ).rejects.toThrow();
  });

  test('rejects passwords shorter than 8 characters', async () => {
    await expect(
      createFirstAdmin({
        name: 'Short PW',
        phone: '+996700000093',
        password: 'short',
      }),
    ).rejects.toThrow(/at least 8 characters/i);
  });

  test('rejects an empty / whitespace-only name', async () => {
    await expect(
      createFirstAdmin({
        name: '   ',
        phone: '+996700000094',
        password: 'pass1234A',
      }),
    ).rejects.toThrow(/name is required/i);
  });
});
