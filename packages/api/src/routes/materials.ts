import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@ekonaryn/db';
import { materialSchema } from '@ekonaryn/shared';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/error';

const router = Router();

// GET /materials (public)
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const materials = await prisma.material.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: materials });
  } catch (err) {
    next(err);
  }
});

// POST /materials (admin)
router.post('/', authenticate, authorize('ADMIN'), validate(materialSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const material = await prisma.material.create({ data: req.body });
    res.status(201).json({ success: true, data: material });
  } catch (err) {
    next(err);
  }
});

// PUT /materials/:id (admin)
router.put('/:id', authenticate, authorize('ADMIN'), validate(materialSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const material = await prisma.material.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: material });
  } catch (err) {
    next(err);
  }
});

// DELETE /materials/:id (admin)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.material.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Material deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
