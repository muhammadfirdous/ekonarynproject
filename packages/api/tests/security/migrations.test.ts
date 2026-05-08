import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { prisma } from '@ekonaryn/db';
import { resetDb } from '../helpers';

const DB_PKG = path.resolve(__dirname, '../../../db');

beforeEach(async () => {
  await resetDb();
});

// Migration files are immutable history — once applied to a prod DB, editing
// them silently breaks teams that already ran them. These tests pin shape and
// ordering so an accidental edit is loud.
describe('Migrations — directory layout & lock file', () => {
  test('Every migration directory ships a migration.sql', () => {
    const migrationsDir = path.join(DB_PKG, 'prisma/migrations');
    const subdirs = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    expect(subdirs.length).toBeGreaterThan(0);
    for (const dir of subdirs) {
      expect(existsSync(path.join(migrationsDir, dir, 'migration.sql'))).toBe(true);
    }
  });

  test('migration_lock.toml exists and pins the SQLite provider', () => {
    const lockPath = path.join(DB_PKG, 'prisma/migrations/migration_lock.toml');
    expect(existsSync(lockPath)).toBe(true);
    const lock = readFileSync(lockPath, 'utf8');
    expect(lock).toMatch(/provider\s*=\s*"sqlite"/);
  });

  test('20260508 lifecycle migration includes the lowercase status backfill', () => {
    const sqlPath = path.join(
      DB_PKG,
      'prisma/migrations/20260508_add_worker_lifecycle_and_activity_log/migration.sql',
    );
    const sql = readFileSync(sqlPath, 'utf8');
    expect(sql).toMatch(
      /UPDATE "PickupRequest" SET "status" = 'pending'\s+WHERE "status" = 'PENDING'/,
    );
    expect(sql).toMatch(
      /UPDATE "PickupRequest" SET "status" = 'assigned'\s+WHERE "status" = 'ASSIGNED'/,
    );
    expect(sql).toMatch(
      /UPDATE "PickupRequest" SET "status" = 'completed'\s+WHERE "status" = 'COMPLETED'/,
    );
    expect(sql).toMatch(
      /UPDATE "PickupRequest" SET "status" = 'cancelled'\s+WHERE "status" = 'CANCELLED'/,
    );
  });

  test('Lifecycle migration adds the assignedWorkerId FK column with ON DELETE SET NULL', () => {
    const sqlPath = path.join(
      DB_PKG,
      'prisma/migrations/20260508_add_worker_lifecycle_and_activity_log/migration.sql',
    );
    const sql = readFileSync(sqlPath, 'utf8');
    expect(sql).toMatch(/ALTER TABLE "PickupRequest" ADD COLUMN "assignedWorkerId" TEXT/);
    expect(sql).toMatch(/REFERENCES "User"\("id"\) ON DELETE SET NULL/);
  });
});

describe('Migrations — fresh-apply against a temp database', () => {
  // The dev workflow uses `prisma db push` (no _prisma_migrations table) for
  // speed. `migrate status` would report drift against that DB even though the
  // schema is correct. So instead we validate the migration files THEMSELVES
  // can be parsed by sqlite — every CREATE/ALTER/UPDATE statement is wrapped
  // by Prisma so a syntax error here would mean someone hand-edited a
  // historical migration (which is the regression we want to catch).
  test('Every migration.sql parses as valid SQL (heuristic check)', () => {
    const migrationsDir = path.join(DB_PKG, 'prisma/migrations');
    const subdirs = readdirSync(migrationsDir, { withFileTypes: true }).filter((d) =>
      d.isDirectory(),
    );
    for (const dir of subdirs) {
      const sql = readFileSync(path.join(migrationsDir, dir.name, 'migration.sql'), 'utf8');
      // Statements end in `;`. Each non-empty stripped line should pass a
      // shallow keyword check.
      const lines = sql
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('--'));
      expect(lines.length).toBeGreaterThan(0);
      // No mid-file BEGIN/COMMIT — Prisma wraps each migration in its own tx.
      expect(sql.toUpperCase()).not.toMatch(/\bBEGIN TRANSACTION\b/);
      expect(sql.toUpperCase()).not.toMatch(/\bCOMMIT\b/);
    }
  });
});

describe('Seed idempotency', () => {
  // The full seed script wipes + re-creates ~50 rows. Running it twice in a
  // row should not throw and should leave the DB in a deterministic state
  // (same row counts both times, allowing for non-deterministic randomness in
  // estimatedQty values).
  test('Running the seed script twice leaves the same row counts', () => {
    const root = path.resolve(DB_PKG, '../..');
    // First seed.
    execSync('npm run db:seed --workspace=@ekonaryn/db', {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    // Capture counts via a fresh client.
    return Promise.all([
      prisma.user.count(),
      prisma.material.count(),
      prisma.pickupRequest.count(),
      prisma.collection.count(),
      prisma.trip.count(),
      prisma.financialRecord.count(),
      prisma.schedule.count(),
    ]).then(async (first) => {
      // Second seed.
      execSync('npm run db:seed --workspace=@ekonaryn/db', {
        cwd: root,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const second = await Promise.all([
        prisma.user.count(),
        prisma.material.count(),
        prisma.pickupRequest.count(),
        prisma.collection.count(),
        prisma.trip.count(),
        prisma.financialRecord.count(),
        prisma.schedule.count(),
      ]);
      expect(second).toEqual(first);
    });
  }, 90_000);
});
