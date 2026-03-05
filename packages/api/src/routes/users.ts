import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@ekonaryn/db';
import { updateUserSchema } from '@ekonaryn/shared';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/error';

const router = Router();

// GET /users (admin only)
router.get('/', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, search } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { phone: { contains: search as string } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, phone: true, role: true, address: true, points: true, createdAt: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: users, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /users/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, phone: true, role: true, address: true, points: true, createdAt: true },
    });

    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// PUT /users/:id
router.put('/:id', authenticate, validate(updateUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only admin or the user themselves
    if (req.user!.role !== 'ADMIN' && req.user!.userId !== req.params.id) {
      throw new AppError('Insufficient permissions', 403);
    }
    // Only admin can change roles
    if (req.body.role && req.user!.role !== 'ADMIN') {
      throw new AppError('Only admin can change roles', 403);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: req.body,
      select: { id: true, name: true, phone: true, role: true, address: true, points: true, createdAt: true },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// DELETE /users/:id (admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
