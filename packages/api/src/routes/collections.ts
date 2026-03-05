import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@ekonaryn/db';
import { collectionSchema } from '@ekonaryn/shared';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../utils/upload';
import { AppError } from '../middleware/error';

const router = Router();

// POST /collections (worker)
router.post('/', authenticate, authorize('WORKER', 'ADMIN'), upload.single('photo'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = collectionSchema.parse({
      requestId: req.body.requestId,
      materialId: req.body.materialId,
      actualWeightKg: parseFloat(req.body.actualWeightKg),
      notes: req.body.notes,
    });

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const collection = await prisma.collection.create({
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

    // Mark request as completed
    await prisma.pickupRequest.update({
      where: { id: parsed.requestId },
      data: { status: 'COMPLETED' },
    });

    // Award points to resident
    const request = await prisma.pickupRequest.findUnique({ where: { id: parsed.requestId } });
    if (request) {
      const pointsEarned = Math.floor(parsed.actualWeightKg);
      await prisma.user.update({
        where: { id: request.residentId },
        data: { points: { increment: pointsEarned } },
      });
    }

    res.status(201).json({ success: true, data: collection });
  } catch (err) {
    next(err);
  }
});

// GET /collections (admin: all, worker: own)
router.get('/', authenticate, authorize('ADMIN', 'WORKER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const where: Record<string, unknown> = {};
    if (req.user!.role === 'WORKER') {
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
});

// GET /collections/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: req.params.id },
      include: {
        material: true,
        worker: { select: { id: true, name: true } },
        request: { include: { resident: { select: { id: true, name: true, phone: true, address: true } } } },
        trip: true,
      },
    });

    if (!collection) throw new AppError('Collection not found', 404);
    res.json({ success: true, data: collection });
  } catch (err) {
    next(err);
  }
});

// PUT /collections/:id
router.put('/:id', authenticate, authorize('ADMIN', 'WORKER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { actualWeightKg, notes, tripId } = req.body;
    const data: Record<string, unknown> = {};
    if (actualWeightKg !== undefined) data.actualWeightKg = actualWeightKg;
    if (notes !== undefined) data.notes = notes;
    if (tripId !== undefined) data.tripId = tripId;

    const collection = await prisma.collection.update({
      where: { id: req.params.id },
      data,
      include: { material: true, worker: { select: { id: true, name: true } } },
    });

    res.json({ success: true, data: collection });
  } catch (err) {
    next(err);
  }
});

export default router;
