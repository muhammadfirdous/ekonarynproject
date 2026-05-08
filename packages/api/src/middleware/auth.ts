import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@ekonaryn/db';
import { AppError } from './error';

export interface JwtPayload {
  userId: string;
  role: string;
  accountStatus?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express types are exposed via a global namespace; module augmentation is the only way to add `req.user`.
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};

/**
 * Block any non-ACTIVE account from reaching role-gated endpoints.
 * Re-reads the user from the DB so suspensions take effect within seconds.
 */
export const requireActiveAccount = async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { accountStatus: true, deletedAt: true },
    });
    if (!user || user.deletedAt) return next(new AppError('Account no longer exists', 401));
    if (user.accountStatus !== 'ACTIVE') {
      return next(
        new AppError(`Account is ${user.accountStatus.toLowerCase().replace('_', ' ')}`, 403),
      );
    }
    // Refresh the cached status on the request so downstream handlers can rely on it.
    req.user.accountStatus = user.accountStatus;
    next();
  } catch (err) {
    next(err);
  }
};
