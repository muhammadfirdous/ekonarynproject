import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@ekonaryn/db';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// GET /analytics/overview
router.get('/overview', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalCollections,
      totalWeightResult,
      totalRevenue,
      activeWorkers,
      totalResidents,
      pendingRequests,
    ] = await Promise.all([
      prisma.collection.count(),
      prisma.collection.aggregate({ _sum: { actualWeightKg: true } }),
      prisma.trip.aggregate({ _sum: { revenue: true } }),
      prisma.user.count({ where: { role: 'WORKER' } }),
      prisma.user.count({ where: { role: 'RESIDENT' } }),
      prisma.pickupRequest.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      success: true,
      data: {
        totalCollections,
        totalWeightKg: totalWeightResult._sum.actualWeightKg || 0,
        totalRevenue: totalRevenue._sum.revenue || 0,
        activeWorkers,
        totalResidents,
        pendingRequests,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /analytics/monthly
router.get('/monthly', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const collections = await prisma.collection.findMany({
      include: { material: true },
      orderBy: { collectedAt: 'asc' },
    });

    const monthly: Record<string, { collections: number; weightKg: number; value: number }> = {};
    for (const c of collections) {
      const key = `${c.collectedAt.getFullYear()}-${String(c.collectedAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { collections: 0, weightKg: 0, value: 0 };
      monthly[key].collections += 1;
      monthly[key].weightKg += c.actualWeightKg;
      monthly[key].value += c.actualWeightKg * c.material.sellingPrice;
    }

    res.json({ success: true, data: monthly });
  } catch (err) {
    next(err);
  }
});

// GET /analytics/materials
router.get('/materials', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.collection.groupBy({
      by: ['materialId'],
      _sum: { actualWeightKg: true },
      _count: { id: true },
    });

    const materials = await prisma.material.findMany();
    const materialMap = Object.fromEntries(materials.map((m) => [m.id, m]));

    const result = data.map((d) => ({
      material: materialMap[d.materialId],
      totalWeightKg: d._sum.actualWeightKg || 0,
      totalCollections: d._count.id,
      estimatedValue: (d._sum.actualWeightKg || 0) * (materialMap[d.materialId]?.sellingPrice || 0),
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /analytics/workers
router.get('/workers', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'WORKER' },
      select: { id: true, name: true, phone: true },
    });

    const workerStats = await Promise.all(
      workers.map(async (worker) => {
        const [collectionsCount, weightResult, tripsCount] = await Promise.all([
          prisma.collection.count({ where: { workerId: worker.id } }),
          prisma.collection.aggregate({
            where: { workerId: worker.id },
            _sum: { actualWeightKg: true },
          }),
          prisma.trip.count({ where: { workerId: worker.id } }),
        ]);

        return {
          worker,
          totalCollections: collectionsCount,
          totalWeightKg: weightResult._sum.actualWeightKg || 0,
          totalTrips: tripsCount,
        };
      }),
    );

    res.json({ success: true, data: workerStats });
  } catch (err) {
    next(err);
  }
});

export default router;
