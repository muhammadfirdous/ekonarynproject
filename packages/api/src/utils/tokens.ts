import jwt from 'jsonwebtoken';
import { JwtPayload } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

export function generateTokens(payload: JwtPayload) {
  const minimal: JwtPayload = {
    userId: payload.userId,
    role: payload.role,
    ...(payload.accountStatus ? { accountStatus: payload.accountStatus } : {}),
  };
  const accessToken = jwt.sign(minimal, JWT_SECRET, {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign(minimal, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
}
