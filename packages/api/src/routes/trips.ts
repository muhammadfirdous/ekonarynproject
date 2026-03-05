import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@ekonaryn/db';
import { tripSchema } from '@ekonaryn/shared';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/error';

const router = Router();

// POST /trips
router.post('/', authenticate, authorize('ADMIN', 'WORKER'), validate(tripSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { collectionIds, ...data } = req.body;

    const trip = await prisma.trip.create({
      data: {
        ...data,
        date: new Date(data.date),
        workerId: req.user!.userId,
      },
      include: { collections: true, worker: { select: { id: true, name: true } } },
    });

    // Link collections to trip if provided
    if (collectionIds && collectionIds.length > 0) {
      await prisma.collection.updateMany({
        where: { id: { in: collectionIds } },
        data: { tripId: trip.id },
      });
    }

    res.status(201).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
});

// GET /trips
router.get('/', authenticate, authorize('ADMIN', 'WORKER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        include: {
          worker: { select: { id: true, name: true } },
          collections: { include: { material: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.trip.count(),
    ]);

    res.json({ success: true, data: trips, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /trips/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        worker: { select: { id: true, name: true } },
        collections: { include: { material: true, request: true } },
      },
    });

    if (!trip) throw new AppError('Trip not found', 404);
    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
});

// PUT /trips/:id
router.put('/:id', authenticate, authorize('ADMIN', 'WORKER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { totalWeightKg, transportCost, revenue, destination } = req.body;
    const data: Record<string, unknown> = {};
    if (totalWeightKg !== undefined) data.totalWeightKg = totalWeightKg;
    if (transportCost !== undefined) data.transportCost = transportCost;
    if (revenue !== undefined) data.revenue = revenue;
    if (destination !== undefined) data.destination = destination;

    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data,
      include: { worker: { select: { id: true, name: true } }, collections: true },
    });

    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
});

export default router;
