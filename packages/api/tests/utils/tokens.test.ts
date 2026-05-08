import jwt from 'jsonwebtoken';
import { generateTokens, verifyRefreshToken } from '../../src/utils/tokens';

const ACCESS_SECRET = process.env.JWT_SECRET ?? 'test-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';

describe('utils/tokens', () => {
  test('generateTokens returns both access and refresh tokens with the expected payload', () => {
    const payload = { userId: 'u-1', role: 'ADMIN', accountStatus: 'ACTIVE' };
    const { accessToken, refreshToken } = generateTokens(payload);

    const decodedAccess = jwt.verify(accessToken, ACCESS_SECRET) as Record<string, unknown>;
    expect(decodedAccess.userId).toBe('u-1');
    expect(decodedAccess.role).toBe('ADMIN');
    expect(decodedAccess.accountStatus).toBe('ACTIVE');
    expect(typeof decodedAccess.exp).toBe('number');
    expect(typeof decodedAccess.iat).toBe('number');

    const decodedRefresh = jwt.verify(refreshToken, REFRESH_SECRET) as Record<string, unknown>;
    expect(decodedRefresh.userId).toBe('u-1');
  });

  test('access TTL is ~15 minutes; refresh TTL is ~7 days', () => {
    const { accessToken, refreshToken } = generateTokens({ userId: 'u-1', role: 'ADMIN' });
    const access = jwt.verify(accessToken, ACCESS_SECRET) as { exp: number; iat: number };
    const refresh = jwt.verify(refreshToken, REFRESH_SECRET) as { exp: number; iat: number };
    expect(access.exp - access.iat).toBe(15 * 60);
    expect(refresh.exp - refresh.iat).toBe(7 * 24 * 60 * 60);
  });

  test('omits accountStatus from the JWT payload when not provided', () => {
    const { accessToken } = generateTokens({ userId: 'u-1', role: 'WORKER' });
    const decoded = jwt.verify(accessToken, ACCESS_SECRET) as Record<string, unknown>;
    expect(decoded.accountStatus).toBeUndefined();
  });

  test('verifyRefreshToken accepts a refresh-signed token', () => {
    const { refreshToken } = generateTokens({ userId: 'u-1', role: 'ADMIN' });
    const payload = verifyRefreshToken(refreshToken);
    expect(payload.userId).toBe('u-1');
    expect(payload.role).toBe('ADMIN');
  });

  test('verifyRefreshToken REJECTS an access-signed token (cross-secret)', () => {
    const { accessToken } = generateTokens({ userId: 'u-1', role: 'ADMIN' });
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });

  test('access secret cannot verify a refresh token (cross-secret)', () => {
    const { refreshToken } = generateTokens({ userId: 'u-1', role: 'ADMIN' });
    expect(() => jwt.verify(refreshToken, ACCESS_SECRET)).toThrow();
  });

  test('tampered access token (last char flipped) fails verification', () => {
    const { accessToken } = generateTokens({ userId: 'u-1', role: 'ADMIN' });
    const tampered = accessToken.slice(0, -1) + (accessToken.endsWith('a') ? 'b' : 'a');
    expect(() => jwt.verify(tampered, ACCESS_SECRET)).toThrow();
  });

  test('expired token fails verification', () => {
    const past = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
    const expired = jwt.sign(
      { userId: 'u-1', role: 'ADMIN', exp: past, iat: past - 60 },
      ACCESS_SECRET,
    );
    expect(() => jwt.verify(expired, ACCESS_SECRET)).toThrow(/jwt expired/);
  });
});
