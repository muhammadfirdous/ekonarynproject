import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@ekonaryn/db';
import { routeSchema } from '@ekonaryn/shared';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/error';

const router = Router();

function parseStops(route: Record<string, unknown>) {
  if (route && typeof route.stops === 'string') {
    return { ...route, stops: JSON.parse(route.stops as string) };
  }
  return route;
}

// POST /routes
router.post('/', authenticate, authorize('ADMIN'), validate(routeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const route = await prisma.route.create({
      data: {
        workerId: req.body.workerId,
        date: new Date(req.body.date),
        stops: JSON.stringify(req.body.stops),
      },
      include: { worker: { select: { id: true, name: true } } },
    });
    res.status(201).json({ success: true, data: parseStops(route as unknown as Record<string, unknown>) });
  } catch (err) {
    next(err);
  }
});

// GET /routes
router.get('/', authenticate, authorize('ADMIN', 'WORKER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, workerId } = req.query;
    const where: Record<string, unknown> = {};

    if (req.user!.role === 'WORKER') {
      where.workerId = req.user!.userId;
    } else if (workerId) {
      where.workerId = workerId;
    }

    if (date) {
      const d = new Date(date as string);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: d, lt: nextDay };
    }

    const routes = await prisma.route.findMany({
      where,
      include: { worker: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: routes.map((r) => parseStops(r as unknown as Record<string, unknown>)) });
  } catch (err) {
    next(err);
  }
});

// GET /routes/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const route = await prisma.route.findUnique({
      where: { id: req.params.id },
      include: { worker: { select: { id: true, name: true, phone: true } } },
    });

    if (!route) throw new AppError('Route not found', 404);
    res.json({ success: true, data: parseStops(route as unknown as Record<string, unknown>) });
  } catch (err) {
    next(err);
  }
});

// PUT /routes/:id
router.put('/:id', authenticate, authorize('ADMIN', 'WORKER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stops, status } = req.body;
    const data: Record<string, unknown> = {};
    if (stops !== undefined) data.stops = JSON.stringify(stops);
    if (status !== undefined) data.status = status;

    const route = await prisma.route.update({
      where: { id: req.params.id },
      data,
      include: { worker: { select: { id: true, name: true } } },
    });

    res.json({ success: true, data: parseStops(route as unknown as Record<string, unknown>) });
  } catch (err) {
    next(err);
  }
});

export default router;
