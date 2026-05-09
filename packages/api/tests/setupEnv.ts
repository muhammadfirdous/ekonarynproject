// Point Prisma at a separate test Postgres database so tests never touch
// the dev database. Local default requires `docker compose up -d postgres`
// and the `ekonaryn_test` database to exist (see TESTING.md). CI sets
// DATABASE_URL via the workflow's postgres service so we honor that
// instead of overriding it.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://ekonaryn:ekonaryn_pass@localhost:5432/ekonaryn_test';
}
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
// CORS allowlist for tests that exercise the cors middleware. Tests that
// don't send an Origin header are unaffected (cors passes them through).
process.env.CORS_ORIGINS = 'http://localhost:3000,http://localhost:3001';
// Disable the auth rate limiter by default so the rest of the suite (which
// makes dozens of /auth/login calls during setup) doesn't trip the
// 20-attempt window. The dedicated rate-limit suite re-enables it per-test.
process.env.DISABLE_RATE_LIMIT = 'true';
