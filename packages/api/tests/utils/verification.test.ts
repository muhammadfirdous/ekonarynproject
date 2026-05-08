import {
  generateCode,
  codeExpiry,
  isCodeValid,
  shouldExposeCode,
} from '../../src/utils/verification';

describe('utils/verification', () => {
  describe('generateCode', () => {
    test('returns a 6-digit numeric string', () => {
      for (let i = 0; i < 50; i++) {
        const c = generateCode();
        expect(c).toMatch(/^\d{6}$/);
        const n = Number(c);
        expect(n).toBeGreaterThanOrEqual(100000);
        expect(n).toBeLessThanOrEqual(999999);
      }
    });
  });

  describe('codeExpiry', () => {
    test('is exactly 15 minutes ahead', () => {
      const now = Date.now();
      const expiry = codeExpiry();
      const delta = expiry.getTime() - now;
      // Allow a small jitter for test execution time.
      expect(delta).toBeGreaterThanOrEqual(15 * 60 * 1000 - 100);
      expect(delta).toBeLessThanOrEqual(15 * 60 * 1000 + 100);
    });
  });

  describe('isCodeValid', () => {
    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);

    test('matches stored code within TTL', () => {
      expect(isCodeValid('123456', future, '123456')).toBe(true);
    });

    test('rejects mismatched code', () => {
      expect(isCodeValid('123456', future, '654321')).toBe(false);
    });

    test('rejects expired stored code', () => {
      expect(isCodeValid('123456', past, '123456')).toBe(false);
    });

    test('rejects null stored code', () => {
      expect(isCodeValid(null, future, '123456')).toBe(false);
    });

    test('rejects null expiry', () => {
      expect(isCodeValid('123456', null, '123456')).toBe(false);
    });

    test('with fake timers, code becomes invalid once the 15-minute window passes', () => {
      jest.useFakeTimers();
      try {
        const stored = '999000';
        const expiry = codeExpiry(); // now + 15 min
        // Before expiry — valid.
        expect(isCodeValid(stored, expiry, '999000')).toBe(true);
        // Production check is `expiry < now`, so at the exact expiry instant
        // it still returns true. One ms past tips it to false.
        jest.setSystemTime(expiry.getTime() + 1);
        expect(isCodeValid(stored, expiry, '999000')).toBe(false);
        // Far past — still invalid.
        jest.advanceTimersByTime(60_000);
        expect(isCodeValid(stored, expiry, '999000')).toBe(false);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('shouldExposeCode', () => {
    const original = process.env.NODE_ENV;
    afterEach(() => {
      process.env.NODE_ENV = original;
    });

    test('true when NODE_ENV is "test"', () => {
      process.env.NODE_ENV = 'test';
      expect(shouldExposeCode()).toBe(true);
    });

    test('true when NODE_ENV is "development"', () => {
      process.env.NODE_ENV = 'development';
      expect(shouldExposeCode()).toBe(true);
    });

    test('true when NODE_ENV is undefined', () => {
      delete process.env.NODE_ENV;
      expect(shouldExposeCode()).toBe(true);
    });

    test('false when NODE_ENV is "production"', () => {
      process.env.NODE_ENV = 'production';
      expect(shouldExposeCode()).toBe(false);
    });
  });
});
