import path from 'path';

// Point Prisma at a separate test sqlite file so tests never touch dev.db.
// The path is relative to the schema file (packages/db/prisma) so it resolves
// to packages/db/prisma/test.db on disk.
const testDbPath = path.resolve(__dirname, '../../db/prisma/test.db');
process.env.DATABASE_URL = `file:${testDbPath.replace(/\\/g, '/')}`;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
