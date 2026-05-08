import rateLimit, { MemoryStore } from 'express-rate-limit';

// Dedicated store so tests can reset the counter between cases
// (the limiter middleware exposes resetKey but not resetAll).
const authStore = new MemoryStore();

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: authStore,
  // Tests opt out via DISABLE_RATE_LIMIT=true (set in tests/setupEnv.ts) so
  // the dozens of /auth/login calls in the rest of the suite don't trip the
  // 20-attempt window. The dedicated rate-limit tests temporarily un-set
  // this env var to exercise the real path.
  skip: () => process.env.DISABLE_RATE_LIMIT === 'true',
  message: { error: { code: 'RATE_LIMIT', message: 'Too many attempts' } },
});

export function resetAuthLimiter(): void {
  authStore.resetAll();
}
