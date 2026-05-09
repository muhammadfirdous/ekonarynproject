import { assertProductionEnv } from '../src/utils/startup';

describe('Startup env guard (assertProductionEnv)', () => {
  let exitSpy: jest.SpyInstance;
  let errSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Stub process.exit so a failing assertion doesn't actually tear down Jest.
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as (code?: number) => never);
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errSpy.mockRestore();
    warnSpy.mockRestore();
  });

  // Low-entropy placeholders: long enough to be semantically "a real secret",
  // structured so gitleaks doesn't flag them as random base64 tokens.
  // (The guard's only requirement is "not in the forbidden set" — entropy is
  // irrelevant here.)
  const REAL_SECRET_A = 'TEST-FIXTURE-NOT-A-REAL-SECRET-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const REAL_SECRET_B = 'TEST-FIXTURE-NOT-A-REAL-SECRET-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
  const REAL_DB_URL = 'postgresql://u:p@localhost:5432/db';

  describe('NODE_ENV=production', () => {
    test('passes silently with strong random secrets', () => {
      assertProductionEnv({
        NODE_ENV: 'production',
        DATABASE_URL: REAL_DB_URL,
        JWT_SECRET: REAL_SECRET_A,
        JWT_REFRESH_SECRET: REAL_SECRET_B,
      });
      expect(exitSpy).not.toHaveBeenCalled();
      expect(errSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    test.each([
      ['empty', ''],
      ['dev-secret', 'dev-secret'],
      ['change-me', 'change-me'],
      ['changeme', 'changeme'],
      ['secret', 'secret'],
    ])('refuses to start when JWT_SECRET is the forbidden value %s', (_label, value) => {
      assertProductionEnv({
        NODE_ENV: 'production',
        DATABASE_URL: REAL_DB_URL,
        JWT_SECRET: value,
        JWT_REFRESH_SECRET: REAL_SECRET_B,
      });
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errSpy).toHaveBeenCalled();
    });

    test('refuses to start when JWT_REFRESH_SECRET is forbidden', () => {
      assertProductionEnv({
        NODE_ENV: 'production',
        DATABASE_URL: REAL_DB_URL,
        JWT_SECRET: REAL_SECRET_A,
        JWT_REFRESH_SECRET: 'change-me',
      });
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('refuses when DATABASE_URL is missing', () => {
      assertProductionEnv({
        NODE_ENV: 'production',
        JWT_SECRET: REAL_SECRET_A,
        JWT_REFRESH_SECRET: REAL_SECRET_B,
      });
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('refuses when both secrets are missing AND default — single exit, both reasons logged', () => {
      assertProductionEnv({
        NODE_ENV: 'production',
        DATABASE_URL: '',
        JWT_SECRET: 'dev-secret',
        JWT_REFRESH_SECRET: '',
      });
      expect(exitSpy).toHaveBeenCalledTimes(1);
      // Two error lines: one for missing, one for insecure, plus the openssl hint.
      expect(errSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    test('trims whitespace before checking forbidden set', () => {
      assertProductionEnv({
        NODE_ENV: 'production',
        DATABASE_URL: REAL_DB_URL,
        JWT_SECRET: '  dev-secret  ',
        JWT_REFRESH_SECRET: REAL_SECRET_B,
      });
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('NODE_ENV != production', () => {
    test('dev with default secrets warns but does not exit', () => {
      assertProductionEnv({
        NODE_ENV: 'development',
        DATABASE_URL: REAL_DB_URL,
        JWT_SECRET: 'dev-secret',
        JWT_REFRESH_SECRET: 'dev-refresh-secret',
      });
      expect(exitSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });

    test('test env with default secrets warns but does not exit', () => {
      assertProductionEnv({
        NODE_ENV: 'test',
        DATABASE_URL: REAL_DB_URL,
        JWT_SECRET: 'dev-secret',
        JWT_REFRESH_SECRET: 'dev-refresh-secret',
      });
      expect(exitSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });

    test('undefined NODE_ENV with default secrets warns but does not exit', () => {
      assertProductionEnv({
        DATABASE_URL: REAL_DB_URL,
        JWT_SECRET: 'dev-secret',
        JWT_REFRESH_SECRET: 'dev-refresh-secret',
      });
      expect(exitSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });

    test('dev with strong secrets is silent', () => {
      assertProductionEnv({
        NODE_ENV: 'development',
        DATABASE_URL: REAL_DB_URL,
        JWT_SECRET: REAL_SECRET_A,
        JWT_REFRESH_SECRET: REAL_SECRET_B,
      });
      expect(exitSpy).not.toHaveBeenCalled();
      expect(errSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
