import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@ekonaryn/db';
import {
  pickupRequestSchema,
  updateRequestStatusSchema,
  assignOrderSchema,
  ActivityAction,
  AccountStatus,
  OrderStatus,
  Role,
} from '@ekonaryn/shared';
import { authenticate, authorize, requireActiveAccount } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { assertTransition } from '../services/orderState';
import { logActivity } from '../services/activityLog';
import { AppError } from '../middleware/error';

const router = Router();

const REQUEST_INCLUDE = {
  material: true,
  resident: { select: { id: true, name: true, phone: true, address: true } },
  assignedWorker: { select: { id: true, name: true, phone: true, accountStatus: true } },
  collection: true,
} as const;

// ============================================================================
// Resident creates a pickup request
// ============================================================================

router.post(
  '/',
  authenticate,
  requireActiveAccount,
  authorize(Role.RESIDENT),
  validate(pickupRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await prisma.pickupRequest.create({
        data: {
          ...req.body,
          residentId: req.user!.userId,
          status: OrderStatus.PENDING,
        },
        include: REQUEST_INCLUDE,
      });

      await logActivity(req, ActivityAction.REQUEST_CREATED, 'pickup_request', request.id, {
        materialId: request.materialId,
        estimatedQty: request.estimatedQty,
      });

      res.status(201).json({ success: true, data: request });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================================
// Listing
// ============================================================================

router.get(
  '/',
  authenticate,
  requireActiveAccount,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { status } = req.query;

      const where: Record<string, unknown> = { deletedAt: null };

      if (req.user!.role === Role.RESIDENT) {
        where.residentId = req.user!.userId;
      } else if (req.user!.role === Role.WORKER) {
        // Workers only see their own assigned orders.
        where.assignedWorkerId = req.user!.userId;
      }
      if (status) {
        where.status = status;
      }

      const [requests, total] = await Promise.all([
        prisma.pickupRequest.findMany({
          where,
          include: REQUEST_INCLUDE,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.pickupRequest.count({ where }),
      ]);

      res.json({ success: true, data: requests, total, page, limit });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================================
// Single read
// ============================================================================

router.get(
  '/:id',
  authenticate,
  requireActiveAccount,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await prisma.pickupRequest.findUnique({
        where: { id: req.params.id },
        include: REQUEST_INCLUDE,
      });

      if (!request || request.deletedAt) throw new AppError('Request not found', 404);

      if (req.user!.role === Role.RESIDENT && request.residentId !== req.user!.userId) {
        throw new AppError('Insufficient permissions', 403);
      }
      if (req.user!.role === Role.WORKER && request.assignedWorkerId !== req.user!.userId) {
        throw new AppError('Insufficient permissions', 403);
      }

      res.json({ success: true, data: request });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================================
// Lifecycle status transition
// ============================================================================

router.put(
  '/:id/status',
  authenticate,
  requireActiveAccount,
  authorize(Role.ADMIN, Role.WORKER),
  validate(updateRequestStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const target = req.body.status as OrderStatus;
      const reason: string | undefined = req.body.reason;

      const result = await prisma.$transaction(async (tx) => {
        const current = await tx.pickupRequest.findUnique({ where: { id: req.params.id } });
        if (!current || current.deletedAt) throw new AppError('Request not found', 404);

        // Workers may only transition their own assigned orders.
        if (req.user!.role === Role.WORKER && current.assignedWorkerId !== req.user!.userId) {
          throw new AppError('Insufficient permissions', 403);
        }

        assertTransition(current.status, target);

        const data: Record<string, unknown> = { status: target };
        if (
          target === OrderStatus.CANCELLED ||
          target === OrderStatus.REJECTED ||
          target === OrderStatus.FAILED
        ) {
          data.cancellationReason = reason ?? current.cancellationReason ?? null;
        }

        const updated = await tx.pickupRequest.update({
          where: { id: req.params.id },
          data,
          include: REQUEST_INCLUDE,
        });

        return { current, updated };
      });

      const action =
        target === OrderStatus.CANCELLED
          ? ActivityAction.REQUEST_CANCELLED
          : ActivityAction.ORDER_STATUS_CHANGED;

      await logActivity(req, action, 'pickup_request', result.updated.id, {
        before: { status: result.current.status },
        after: { status: result.updated.status },
        reason: reason ?? null,
      });

      res.json({ success: true, data: result.updated });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================================
// Admin assigns an order to a worker
// ============================================================================

router.post(
  '/:id/assign',
  authenticate,
  requireActiveAccount,
  authorize(Role.ADMIN),
  validate(assignOrderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workerId } = req.body;

      const result = await prisma.$transaction(async (tx) => {
        // Lock the request row by reading it first inside the transaction.
        const request = await tx.pickupRequest.findUnique({ where: { id: req.params.id } });
        if (!request || request.deletedAt) throw new AppError('Request not found', 404);
        if (request.status !== OrderStatus.PENDING && request.status !== OrderStatus.ACCEPTED) {
          throw new AppError(
            `Cannot assign a request in status ${request.status}. Only pending/accepted requests are assignable.`,
            409,
          );
        }
        // Reassignment guardrail: don't silently overwrite an existing assignment.
        const isReassignment = !!request.assignedWorkerId && request.assignedWorkerId !== workerId;

        const worker = await tx.user.findUnique({ where: { id: workerId } });
        if (!worker || worker.deletedAt) throw new AppError('Worker not found', 404);
        if (worker.role !== Role.WORKER) throw new AppError('User is not a worker', 400);
        if (worker.accountStatus !== AccountStatus.ACTIVE) {
          throw new AppError(`Worker is not active (current status: ${worker.accountStatus})`, 409);
        }
        if (!worker.onShift) {
          throw new AppError('Worker is not on shift', 409);
        }

        // Concurrent-orders guardrail.
        const activeCount = await tx.pickupRequest.count({
          where: {
            assignedWorkerId: worker.id,
            status: { in: [OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS] },
          },
        });
        const cap = worker.maxConcurrentOrders ?? 5;
        if (activeCount >= cap) {
          throw new AppError(`Worker is at capacity (${activeCount}/${cap} active orders)`, 409);
        }

        // Service-area guardrail. Fall back to "no-area constraint" if either side is empty,
        // since the address may be free-form text and we don't want to block all assignments
        // when areas haven't been catalogued yet.
        if (worker.serviceAreas) {
          let areas: string[] = [];
          try {
            areas = JSON.parse(worker.serviceAreas);
          } catch {
            areas = [];
          }
          if (areas.length > 0) {
            const addressLower = request.address.toLowerCase();
            const covers = areas.some((area) => addressLower.includes(area.toLowerCase()));
            if (!covers) {
              throw new AppError(
                `Worker's service areas (${areas.join(', ')}) do not cover the pickup address`,
                409,
              );
            }
          }
        }

        // Conditional update enforces optimistic concurrency: if another admin
        // assigned the request concurrently, the where-clause status check fails
        // and updateMany returns count 0.
        const fromStatus = request.status;
        const upd = await tx.pickupRequest.updateMany({
          where: { id: request.id, status: fromStatus },
          data: {
            status: OrderStatus.ASSIGNED,
            assignedWorkerId: worker.id,
            assignedAt: new Date(),
          },
        });
        if (upd.count === 0) {
          throw new AppError(
            'Request was modified by another admin — please reload and try again',
            409,
          );
        }

        const updated = await tx.pickupRequest.findUnique({
          where: { id: request.id },
          include: REQUEST_INCLUDE,
        });
        return { request, updated: updated!, isReassignment };
      });

      // Notify the worker.
      await prisma.notification.create({
        data: {
          userId: workerId,
          title: 'New pickup assigned',
          body: `You have been assigned a pickup at ${result.updated.address}.`,
        },
      });

      await logActivity(
        req,
        result.isReassignment ? ActivityAction.ORDER_REASSIGNED : ActivityAction.ORDER_ASSIGNED,
        'pickup_request',
        result.updated.id,
        {
          before: {
            status: result.request.status,
            assignedWorkerId: result.request.assignedWorkerId,
          },
          after: {
            status: result.updated.status,
            assignedWorkerId: result.updated.assignedWorkerId,
          },
        },
      );

      res.json({ success: true, data: result.updated });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================================
// Delete (soft) — residents may delete their own pending requests; admin always.
// ============================================================================

router.delete(
  '/:id',
  authenticate,
  requireActiveAccount,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await prisma.pickupRequest.findUnique({ where: { id: req.params.id } });
      if (!request || request.deletedAt) throw new AppError('Request not found', 404);

      if (req.user!.role === Role.RESIDENT) {
        if (request.residentId !== req.user!.userId)
          throw new AppError('Insufficient permissions', 403);
        if (request.status !== OrderStatus.PENDING) {
          throw new AppError('Can only delete pending requests', 400);
        }
      } else if (req.user!.role === Role.WORKER) {
        throw new AppError('Insufficient permissions', 403);
      }

      await prisma.pickupRequest.update({
        where: { id: req.params.id },
        data: {
          deletedAt: new Date(),
          status: OrderStatus.CANCELLED,
          cancellationReason: 'deleted',
        },
      });

      await logActivity(req, ActivityAction.REQUEST_CANCELLED, 'pickup_request', request.id, {
        before: { status: request.status },
        after: { status: OrderStatus.CANCELLED },
        reason: 'deleted',
      });

      res.json({ success: true, message: 'Request deleted' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
