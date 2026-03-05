import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@ekonaryn/db';
import { registerSchema, loginSchema } from '@ekonaryn/shared';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { generateTokens, verifyRefreshToken } from '../utils/tokens';
import { AppError } from '../middleware/error';

const router = Router();

// POST /auth/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, password, address } = req.body;

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new AppError('Phone number already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, phone, password: hashedPassword, address },
    });

    const tokens = generateTokens({ userId: user.id, role: user.role });

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role, points: user.points },
        ...tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new AppError('Invalid phone or password', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError('Invalid phone or password', 401);
    }

    const tokens = generateTokens({ userId: user.id, role: user.role });

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role, points: user.points },
        ...tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    const payload = verifyRefreshToken(refreshToken);
    const tokens = generateTokens({ userId: payload.userId, role: payload.role });

    res.json({ success: true, data: tokens });
  } catch (err) {
    next(new AppError('Invalid refresh token', 401));
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, phone: true, role: true, address: true, points: true, createdAt: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export default router;
