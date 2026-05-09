import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@ekonaryn/db';
import { authenticate, requireActiveAccount } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();

// GET /notifications — current user's notifications, newest first.
// Capped at 50; the dashboard dropdown only shows a recent slice.
router.get(
  '/',
  authenticate,
  requireActiveAccount,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  },
);

// POST /notifications/:id/read — mark one as read. Uses updateMany with the
// userId in the WHERE clause so a malicious user can't mark someone else's
// notification (the count comes back 0 → 404).
router.post(
  '/:id/read',
  authenticate,
  requireActiveAccount,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await prisma.notification.updateMany({
        where: { id: req.params.id, userId: req.user!.userId },
        data: { read: true },
      });
      if (result.count === 0) throw new AppError('Notification not found', 404);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
