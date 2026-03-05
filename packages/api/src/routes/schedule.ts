import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@ekonaryn/db';
import { scheduleSchema } from '@ekonaryn/shared';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// GET /schedule (public)
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const schedules = await prisma.schedule.findMany({
      where: { active: true },
      orderBy: [{ dayOfWeek: 'asc' }, { time: 'asc' }],
    });
    res.json({ success: true, data: schedules });
  } catch (err) {
    next(err);
  }
});

// POST /schedule (admin)
router.post('/', authenticate, authorize('ADMIN'), validate(scheduleSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await prisma.schedule.create({ data: req.body });
    res.status(201).json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
});

// PUT /schedule/:id (admin)
router.put('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { area, dayOfWeek, time, active } = req.body;
    const data: Record<string, unknown> = {};
    if (area !== undefined) data.area = area;
    if (dayOfWeek !== undefined) data.dayOfWeek = dayOfWeek;
    if (time !== undefined) data.time = time;
    if (active !== undefined) data.active = active;

    const schedule = await prisma.schedule.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
});

export default router;
