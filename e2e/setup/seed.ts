import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

// Reset & reseed the API's dev.db. The seed script (packages/db/prisma/seed.ts)
// wipes every table and rewrites the canonical fixtures we exercise in E2E:
//   - Admin:      +996700000001 / admin123
//   - Worker:     +996700000002 / worker123  (ACTIVE, on shift)
//   - Worker3:    +996700000004 / worker123  (ACTIVE, NOT on shift)
//   - Worker pending: +996700000005 / worker123 (PENDING_APPROVAL)
//   - Resident:   +996700100001 / resident123
//   - Materials, schedules, sample requests
//
// We shell out to the npm script so the same seed used by `npm run db:seed`
// runs here. ts-node lives under packages/db's devDeps.
export function reseed(): void {
  const root = resolve(__dirname, '../..');
  execSync('npm run db:seed --workspace=@ekonaryn/db', {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}
