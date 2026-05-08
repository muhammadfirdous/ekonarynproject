import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// The schema hardcodes file:./dev.db (relative to the schema directory). Tests
// set DATABASE_URL to a separate file so they never touch dev data; the override
// kicks in only when DATABASE_URL is explicitly set, leaving normal app runs
// pointing at dev.db with zero env required.
const overrideUrl = process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    ...(overrideUrl ? { datasources: { db: { url: overrideUrl } } } : {}),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { PrismaClient };
export * from '@prisma/client';
