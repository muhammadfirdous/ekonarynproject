import { execSync } from 'child_process';
import path from 'path';

export default async function globalSetup() {
  const url = 'postgresql://ekonaryn:ekonaryn_pass@localhost:5432/ekonaryn_test';
  process.env.DATABASE_URL = url;

  // Wipe any leftover state from a prior failed run so each `npm test` starts clean.
  // For Postgres we drop + recreate the public schema (the SQLite predecessor
  // unlinked the test.db file).
  const { PrismaClient } = require('@prisma/client');
  const reset = new PrismaClient({ datasources: { db: { url } } });
  try {
    await reset.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE');
    await reset.$executeRawUnsafe('CREATE SCHEMA public');
    await reset.$executeRawUnsafe('GRANT ALL ON SCHEMA public TO ekonaryn');
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
