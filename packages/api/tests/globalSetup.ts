import { execSync } from 'child_process';
import path from 'path';

export default async function globalSetup() {
  // CI sets DATABASE_URL via the workflow's postgres service container.
  // Locally fall back to the docker-compose dev/test database.
  const url =
    process.env.DATABASE_URL || 'postgresql://ekonaryn:ekonaryn_pass@localhost:5432/ekonaryn_test';
  process.env.DATABASE_URL = url;

  // Wipe any leftover state from a prior failed run so each `npm test` starts clean.
  // For Postgres we drop + recreate the public schema (the SQLite predecessor
  // unlinked the test.db file).
  const { PrismaClient } = require('@prisma/client');
  const reset = new PrismaClient({ datasources: { db: { url } } });
  try {
    await reset.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE');
    await reset.$executeRawUnsafe('CREATE SCHEMA public');
    // The connecting user (whoever owns the URL) is the implicit owner of the
    // freshly-created schema. We only need the explicit GRANT TO public so
    // postgres 15+ stops blocking writes from the connecting role itself.
    // We deliberately do NOT grant to a hardcoded role name — CI runs as
    // `test`, local runs as `ekonaryn`, and an explicit GRANT to either
    // would error against the other.
    await reset.$executeRawUnsafe('GRANT ALL ON SCHEMA public TO public');
  } finally {
    await reset.$disconnect();
  }

  // db push (rather than migrate) keeps the test DB in sync with the schema without
  // tracking a migration history — fine for an ephemeral test database.
  execSync('npx prisma db push --skip-generate', {
    cwd: path.resolve(__dirname, '../../db'),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });
}
