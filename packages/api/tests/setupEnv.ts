// Point Prisma at a separate test Postgres database so tests never touch
// the dev database. Requires `docker compose up -d postgres` and the
// `ekonaryn_test` database to exist (see TESTING.md).
process.env.DATABASE_URL = 'postgresql://ekonaryn:ekonaryn_pass@localhost:5432/ekonaryn_test';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
// CORS allowlist for tests that exercise the cors middleware. Tests that
// don't send an Origin header are unaffected (cors passes them through).
process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:3001';
