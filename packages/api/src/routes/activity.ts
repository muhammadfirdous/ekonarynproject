import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@ekonaryn/db';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@ekonaryn/shared';

const router = Router();

// GET /activity (admin only) — paginated, filterable by action/entity/actor.
router.get(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const { action, entityType, entityId, actorId } = req.query;

      const where: Record<string, unknown> = {};
      if (action) where.action = action;
      if (entityType) where.entityType = entityType;
      if (entityId) where.entityId = entityId;
      if (actorId) where.actorId = actorId;

      const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.activityLog.count({ where }),
      ]);

      res.json({ success: true, data: logs, total, page, limit });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
