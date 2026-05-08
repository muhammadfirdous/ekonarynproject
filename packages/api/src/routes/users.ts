import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@ekonaryn/db';
import {
  updateUserSchema,
  rejectWorkerSchema,
  suspendWorkerSchema,
  reactivateWorkerSchema,
  ActivityAction,
  AccountStatus,
  Role,
} from '@ekonaryn/shared';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { logActivity } from '../services/activityLog';
import { AppError } from '../middleware/error';

const router = Router();

const PUBLIC_FIELDS = {
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
  address: true,
  points: true,
  accountStatus: true,
  statusReason: true,
  statusChangedAt: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  idNumber: true,
  idDocumentUrl: true,
  serviceAreas: true,
  vehicleType: true,
  vehiclePlate: true,
  vehicleCapacityKg: true,
  maxConcurrentOrders: true,
  onShift: true,
  createdAt: true,
} as const;

// ============================================================================
// Worker approval queue & actions (admin only) — declared BEFORE /:id so the
// path segments don't get swallowed by the catch-all id route.
// ============================================================================

router.get(
  '/workers/pending',
  authenticate,
  authorize(Role.ADMIN),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const workers = await prisma.user.findMany({
        where: {
          role: Role.WORKER,
          accountStatus: AccountStatus.PENDING_APPROVAL,
          deletedAt: null,
        },
        select: PUBLIC_FIELDS,
        orderBy: { createdAt: 'asc' },
      });
      res.json({ success: true, data: workers, total: workers.length });
    } catch (err) {
      next(err);
    }
  },
);

async function transitionWorkerStatus(
  req: Request,
  workerId: string,
  to: AccountStatus,
  action: ActivityAction,
  reason: string | null,
  notificationTitle: string,
  notificationBody: string,
  allowedFrom: AccountStatus[],
) {
  const worker = await prisma.user.findUnique({ where: { id: workerId } });
  if (!worker || worker.deletedAt) throw new AppError('Worker not found', 404);
  if (worker.role !== Role.WORKER) throw new AppError('User is not a worker', 400);
  if (!allowedFrom.includes(worker.accountStatus as AccountStatus)) {
    throw new AppError(
      `Cannot ${action.split('.')[1]} a worker in status ${worker.accountStatus}`,
      409,
    );
  }

  const updated = await prisma.user.update({
    where: { id: workerId },
    data: {
      accountStatus: to,
      statusReason: reason,
      statusChangedAt: new Date(),
      statusChangedById: req.user!.userId,
    },
    select: PUBLIC_FIELDS,
  });

  await prisma.notification.create({
    data: {
      userId: workerId,
      title: notificationTitle,
      body: notificationBody,
    },
  });

  await logActivity(req, action, 'user', workerId, {
    before: { accountStatus: worker.accountStatus },
    after: { accountStatus: to },
    reason,
  });

  return updated;
}

router.post(
  '/:id/approve',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await transitionWorkerStatus(
        req,
        req.params.id,
        AccountStatus.ACTIVE,
        ActivityAction.WORKER_APPROVED,
        null,
        'Account approved',
        'Welcome aboard! Your worker account has been approved and you can now sign in.',
        [AccountStatus.PENDING_APPROVAL, AccountStatus.SUSPENDED],
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/:id/reject',
  authenticate,
  authorize(Role.ADMIN),
  validate(rejectWorkerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await transitionWorkerStatus(
        req,
        req.params.id,
        AccountStatus.REJECTED,
        ActivityAction.WORKER_REJECTED,
        req.body.reason,
        'Application rejected',
        `Your application was rejected. Reason: ${req.body.reason}`,
        [AccountStatus.PENDING_APPROVAL],
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/:id/suspend',
  authenticate,
  authorize(Role.ADMIN),
  validate(suspendWorkerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await transitionWorkerStatus(
        req,
        req.params.id,
        AccountStatus.SUSPENDED,
        ActivityAction.WORKER_SUSPENDED,
        req.body.reason,
        'Account suspended',
        `Your account has been suspended. Reason: ${req.body.reason}`,
        [AccountStatus.ACTIVE],
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/:id/reactivate',
  authenticate,
  authorize(Role.ADMIN),
  validate(reactivateWorkerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await transitionWorkerStatus(
        req,
        req.params.id,
        AccountStatus.ACTIVE,
        ActivityAction.WORKER_REACTIVATED,
        req.body.reason || null,
        'Account reactivated',
        'Your account has been reactivated. You can sign in again.',
        [AccountStatus.SUSPENDED],
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================================
// Generic user listing
// ============================================================================

router.get(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role, search, accountStatus } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const where: Record<string, unknown> = { deletedAt: null };
      if (role) where.role = role;
      if (accountStatus) where.accountStatus = accountStatus;
      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { phone: { contains: search as string } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: PUBLIC_FIELDS,
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
  },
);

router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Use findFirst so we can apply the deletedAt filter in the same query —
    // matches the list endpoint (`GET /users`) which already filters soft-
    // deleted rows. findUnique only accepts unique fields in `where`, so we
    // can't add deletedAt to it directly.
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: PUBLIC_FIELDS,
    });

    if (!user) throw new AppError('User not found', 404);

    // Residents may only fetch themselves; workers may only fetch themselves.
    if (req.user!.role !== Role.ADMIN && req.user!.userId !== user.id) {
      throw new AppError('Insufficient permissions', 403);
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/:id',
  authenticate,
  validate(updateUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user!.role !== Role.ADMIN && req.user!.userId !== req.params.id) {
        throw new AppError('Insufficient permissions', 403);
      }
      if (req.body.role && req.user!.role !== Role.ADMIN) {
        throw new AppError('Only admin can change roles', 403);
      }
      if (req.body.accountStatus && req.user!.role !== Role.ADMIN) {
        throw new AppError('Only admin can change account status', 403);
      }

      const data: Record<string, unknown> = { ...req.body };
      if (Array.isArray(data.serviceAreas)) {
        data.serviceAreas = JSON.stringify(data.serviceAreas);
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data,
        select: PUBLIC_FIELDS,
      });

      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Soft delete: set deletedAt instead of removing the row, so historical
      // requests/collections continue to render the user's name correctly.
      await prisma.user.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() },
      });
      res.json({ success: true, message: 'User deleted' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
