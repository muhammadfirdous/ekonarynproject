import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@ekonaryn/db';
import { collectionSchema, OrderStatus, ActivityAction, Role } from '@ekonaryn/shared';
import { authenticate, authorize, requireActiveAccount } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../utils/upload';
import { assertTransition } from '../services/orderState';
import { logActivity } from '../services/activityLog';
import { AppError } from '../middleware/error';

const router = Router();

// Multer hands actualWeightKg over as a string when the request is multipart;
// collectionSchema expects a number. Coerce here so validate() can do its job.
const coerceCollectionBody = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body?.actualWeightKg != null && req.body.actualWeightKg !== '') {
    req.body = { ...req.body, actualWeightKg: parseFloat(req.body.actualWeightKg) };
  }
  next();
};

router.post(
  '/',
  authenticate,
  requireActiveAccount,
  authorize(Role.WORKER, Role.ADMIN),
  upload.single('photo'),
  coerceCollectionBody,
  validate(collectionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = req.body;

      const photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

      const result = await prisma.$transaction(async (tx) => {
        const request = await tx.pickupRequest.findUnique({ where: { id: parsed.requestId } });
        if (!request || request.deletedAt) throw new AppError('Request not found', 404);

        // Workers may only collect orders assigned to themselves.
        if (req.user!.role === Role.WORKER && request.assignedWorkerId !== req.user!.userId) {
          throw new AppError('You are not assigned to this request', 403);
        }

        // From `assigned` we go through `in_progress` → `completed`. Both transitions
        // are validated up front so an illegal jump fails before the side effects.
        const intermediateNeeded = request.status === OrderStatus.ASSIGNED;
        if (intermediateNeeded) {
          assertTransition(request.status, OrderStatus.IN_PROGRESS);
          assertTransition(OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED);
        } else {
          assertTransition(request.status, OrderStatus.COMPLETED);
        }

        const collection = await tx.collection.create({
          data: {
            ...parsed,
            workerId: req.user!.userId,
            photoUrl,
          },
          include: {
            material: true,
            request: { include: { resident: { select: { id: true, name: true, phone: true } } } },
          },
        });

        const updated = await tx.pickupRequest.update({
          where: { id: parsed.requestId },
          data: { status: OrderStatus.COMPLETED },
        });

        const pointsEarned = Math.floor(parsed.actualWeightKg);
        if (pointsEarned > 0) {
          await tx.user.update({
            where: { id: request.residentId },
            data: { points: { increment: pointsEarned } },
          });
        }

        return { collection, before: request.status, after: updated.status, requestId: updated.id };
      });

      await logActivity(
        req,
        ActivityAction.ORDER_STATUS_CHANGED,
        'pickup_request',
        result.requestId,
        {
          before: { status: result.before },
          after: { status: result.after },
          via: 'collection_logged',
        },
      );

      res.status(201).json({ success: true, data: result.collection });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/',
  authenticate,
  requireActiveAccount,
  authorize(Role.ADMIN, Role.WORKER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const where: Record<string, unknown> = {};
      if (req.user!.role === Role.WORKER) {
        where.workerId = req.user!.userId;
      }

      const [collections, total] = await Promise.all([
        prisma.collection.findMany({
          where,
          include: {
            material: true,
            worker: { select: { id: true, name: true } },
            request: { include: { resident: { select: { id: true, name: true, phone: true } } } },
            trip: true,
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { collectedAt: 'desc' },
        }),
        prisma.collection.count({ where }),
      ]);

      res.json({ success: true, data: collections, total, page, limit });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/:id',
  authenticate,
  requireActiveAccount,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const collection = await prisma.collection.findUnique({
        where: { id: req.params.id },
        include: {
          material: true,
          worker: { select: { id: true, name: true } },
          request: {
            include: { resident: { select: { id: true, name: true, phone: true, address: true } } },
          },
          trip: true,
        },
      });

      if (!collection) throw new AppError('Collection not found', 404);

      if (req.user!.role === Role.WORKER && collection.workerId !== req.user!.userId) {
        throw new AppError('Insufficient permissions', 403);
      }

      res.json({ success: true, data: collection });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/:id',
  authenticate,
  requireActiveAccount,
  authorize(Role.ADMIN, Role.WORKER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { actualWeightKg, notes, tripId } = req.body;
      const data: Record<string, unknown> = {};
      if (actualWeightKg !== undefined) data.actualWeightKg = actualWeightKg;
      if (notes !== undefined) data.notes = notes;
      if (tripId !== undefined) data.tripId = tripId;

      // Workers may only mutate their own collections.
      if (req.user!.role === Role.WORKER) {
        const owned = await prisma.collection.findUnique({ where: { id: req.params.id } });
        if (!owned || owned.workerId !== req.user!.userId) {
          throw new AppError('Insufficient permissions', 403);
        }
      }

      const collection = await prisma.collection.update({
        where: { id: req.params.id },
        data,
        include: { material: true, worker: { select: { id: true, name: true } } },
      });

      res.json({ success: true, data: collection });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
