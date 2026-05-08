import path from 'path';
import fs from 'fs';

// Runs once after the entire suite finishes.
// Removes the SQLite test DB so the next run starts from a clean schema push.
// We intentionally do NOT close any Prisma client here — each test file that
// imports `@ekonaryn/db` is responsible for `prisma.$disconnect()` in its own
// afterAll. Jest exits the process after this hook anyway.
export default async function globalTeardown() {
  const dbPath = path.resolve(__dirname, '../../db/prisma/test.db');
  for (const ext of ['', '-journal', '-wal', '-shm']) {
    const p = `${dbPath}${ext}`;
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch {
      // Windows occasionally holds a transient handle on the WAL/SHM sidecar
      // files for a few ms after the last connection closes. Failing to delete
      // them is harmless — globalSetup wipes the main DB on the next run.
    }
  }
}
