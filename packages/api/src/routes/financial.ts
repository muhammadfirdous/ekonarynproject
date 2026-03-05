import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@ekonaryn/db';
import { financialRecordSchema } from '@ekonaryn/shared';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// POST /financial
router.post('/', authenticate, authorize('ADMIN'), validate(financialRecordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await prisma.financialRecord.create({
      data: { ...req.body, date: new Date(req.body.date) },
    });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

// GET /financial
router.get('/', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const { type, category, from, to } = req.query;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, unknown>).gte = new Date(from as string);
      if (to) (where.date as Record<string, unknown>).lte = new Date(to as string);
    }

    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.financialRecord.count({ where }),
    ]);

    res.json({ success: true, data: records, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /financial/summary
router.get('/summary', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [incomeResult, expenseResult] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { type: 'INCOME' },
        _sum: { amount: true },
      }),
      prisma.financialRecord.aggregate({
        where: { type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeResult._sum.amount || 0;
    const totalExpenses = expenseResult._sum.amount || 0;
    const profit = totalIncome - totalExpenses;

    // Category breakdown
    const byCategory = await prisma.financialRecord.groupBy({
      by: ['category', 'type'],
      _sum: { amount: true },
    });

    // Monthly summary
    const records = await prisma.financialRecord.findMany({
      orderBy: { date: 'asc' },
    });

    const monthly: Record<string, { income: number; expenses: number; profit: number }> = {};
    for (const r of records) {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { income: 0, expenses: 0, profit: 0 };
      if (r.type === 'INCOME') {
        monthly[key].income += r.amount;
      } else {
        monthly[key].expenses += r.amount;
      }
      monthly[key].profit = monthly[key].income - monthly[key].expenses;
    }

    res.json({
      success: true,
      data: { totalIncome, totalExpenses, profit, byCategory, monthly },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
