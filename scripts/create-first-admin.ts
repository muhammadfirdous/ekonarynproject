/**
 * One-shot bootstrap for the first ADMIN account in a fresh production
 * deployment. Refuses to run if any ADMIN already exists, so it's safe to
 * leave the script in the image. The seed script ships publicly-known
 * test credentials and must NEVER run against a real DB — see
 * DEPLOYMENT.md §4.2.
 *
 * Run:
 *   docker compose -f docker-compose.prod.yml run --rm api npm run admin:create
 *
 * The function `createFirstAdmin` is exported for the unit test next to
 * this file; the interactive `main()` runs only when this file is the
 * Node entry point.
 */
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import bcrypt from 'bcryptjs';
import { prisma } from '@ekonaryn/db';
import { phoneSchema } from '@ekonaryn/shared';

const PASSWORD_MIN = 8;
// Matches the hashing cost used in packages/db/prisma/seed.ts so any password
// hashed by either path is verifiable by the same bcrypt.compare() in
// routes/auth.ts.
const BCRYPT_COST = 10;

export interface FirstAdminInput {
  name: string;
  phone: string;
  password: string;
}

export async function createFirstAdmin(input: FirstAdminInput): Promise<{ id: string }> {
  // Validate via the shared schema so phone format stays in lock-step with
  // the rest of the API surface (no duplicated regex).
  phoneSchema.parse(input.phone);

  if (input.password.length < PASSWORD_MIN) {
    throw new Error(`Password must be at least ${PASSWORD_MIN} characters`);
  }
  if (!input.name.trim()) {
    throw new Error('Name is required');
  }

  // Refusal gate: only the FIRST admin gets bootstrapped this way. Once an
  // admin exists, further admin creation is an in-app concern.
  const existing = await prisma.user.findFirst({
    where: { role: 'ADMIN', deletedAt: null },
    select: { id: true },
  });
  if (existing) {
    throw new Error('An admin account already exists. Use the dashboard to manage admin users.');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      phone: input.phone,
      password: passwordHash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      // Bootstrap admin is implicitly trusted — no SMS round-trip needed.
      phoneVerifiedAt: new Date(),
    },
    select: { id: true },
  });
  return user;
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  try {
    const name = (await rl.question('Admin name: ')).trim();
    const phone = (await rl.question('Phone (+996XXXXXXXXX): ')).trim();
    const password = await rl.question(`Password (min ${PASSWORD_MIN} chars): `);
    const confirm = await rl.question('Confirm password: ');
    if (password !== confirm) {
      console.error('Passwords do not match.');
      process.exit(1);
    }

    const { id } = await createFirstAdmin({ name, phone, password });
    console.log(`✓ Admin created. id=${id}`);
  } catch (err) {
    console.error('Failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
