import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@ekonaryn/db';
import { pickupRequestSchema, updateRequestStatusSchema } from '@ekonaryn/shared';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/error';

const router = Router();

// POST /requests (resident)
router.post('/', authenticate, authorize('RESIDENT'), validate(pickupRequestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.pickupRequest.create({
      data: {
        ...req.body,
        residentId: req.user!.userId,
      },
      include: { material: true, resident: { select: { id: true, name: true, phone: true } } },
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
});

// GET /requests (admin: all, resident: own)
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { status } = req.query;

    const where: Record<string, unknown> = {};

    if (req.user!.role === 'RESIDENT') {
      where.residentId = req.user!.userId;
    }
    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.pickupRequest.findMany({
        where,
        include: {
          material: true,
          resident: { select: { id: true, name: true, phone: true, address: true } },
          collection: true,
        },
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
});

// GET /requests/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.pickupRequest.findUnique({
      where: { id: req.params.id },
      include: {
        material: true,
        resident: { select: { id: true, name: true, phone: true, address: true } },
        collection: true,
      },
    });

    if (!request) throw new AppError('Request not found', 404);

    // Residents can only see their own
    if (req.user!.role === 'RESIDENT' && request.residentId !== req.user!.userId) {
      throw new AppError('Insufficient permissions', 403);
    }

    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
});

// PUT /requests/:id/status (admin/worker)
router.put('/:id/status', authenticate, authorize('ADMIN', 'WORKER'), validate(updateRequestStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.pickupRequest.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
      include: { material: true, resident: { select: { id: true, name: true, phone: true } } },
    });
    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
});

// DELETE /requests/:id
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.pickupRequest.findUnique({ where: { id: req.params.id } });
    if (!request) throw new AppError('Request not found', 404);

    // Residents can only delete their own pending requests
    if (req.user!.role === 'RESIDENT') {
      if (request.residentId !== req.user!.userId) throw new AppError('Insufficient permissions', 403);
      if (request.status !== 'PENDING') throw new AppError('Can only delete pending requests', 400);
    }

    await prisma.pickupRequest.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Request deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
