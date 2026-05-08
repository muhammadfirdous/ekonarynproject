import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export default async function globalSetup() {
  const dbPath = path.resolve(__dirname, '../../db/prisma/test.db');
  const url = `file:${dbPath.replace(/\\/g, '/')}`;
  process.env.DATABASE_URL = url;

  // Wipe any leftover state from a prior failed run so each `npm test` starts clean.
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

  // db push (rather than migrate) keeps the test DB in sync with the schema without
  // tracking a migration history — fine for an ephemeral test database.
  execSync('npx prisma db push --skip-generate', {
    cwd: path.resolve(__dirname, '../../db'),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });
}
