import { factories } from '../factories';
import { loginAs } from '../auth';
import { resetDb } from '../helpers';
import { prisma } from '@ekonaryn/db';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/v1/financial', () => {
  test('admin can create INCOME and EXPENSE rows', async () => {
    const { agent } = await loginAs('admin');
    for (const type of ['INCOME', 'EXPENSE'] as const) {
      const res = await agent.post('/api/v1/financial').send({
        type,
        amount: 1000,
        description: `Test ${type}`,
        category: type === 'INCOME' ? 'sales' : 'fuel',
        date: new Date().toISOString(),
      });
      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe(type);
    }
  });

  test('non-admin → 403', async () => {
    const { agent } = await loginAs('worker');
    const res = await agent.post('/api/v1/financial').send({
      type: 'INCOME',
      amount: 100,
      description: 'x',
      date: new Date().toISOString(),
    });
    expect(res.status).toBe(403);
  });

  test('non-positive amount → 400', async () => {
    const { agent } = await loginAs('admin');
    const res = await agent.post('/api/v1/financial').send({
      type: 'INCOME',
      amount: 0,
      description: 'x',
      date: new Date().toISOString(),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/financial filters', () => {
  test('filters by type, category, and date range', async () => {
    const { agent } = await loginAs('admin');
    const a = new Date('2026-01-15T00:00:00.000Z');
    const b = new Date('2026-02-15T00:00:00.000Z');
    const c = new Date('2026-03-15T00:00:00.000Z');
    await factories.financialRecord({ type: 'INCOME', amount: 100, category: 'sales', date: a });
    await factories.financialRecord({ type: 'EXPENSE', amount: 50, category: 'fuel', date: b });
    await factories.financialRecord({ type: 'INCOME', amount: 200, category: 'grant', date: c });

    const onlyIncome = await agent.get('/api/v1/financial?type=INCOME');
    expect(onlyIncome.body.data.every((r: { type: string }) => r.type === 'INCOME')).toBe(true);
    expect(onlyIncome.body.data).toHaveLength(2);

    const onlyFuel = await agent.get('/api/v1/financial?category=fuel');
    expect(onlyFuel.body.data).toHaveLength(1);

    const ranged = await agent.get('/api/v1/financial?from=2026-02-01&to=2026-03-01');
    expect(ranged.body.data).toHaveLength(1);
    expect(ranged.body.data[0].category).toBe('fuel');
  });
});

describe('GET /api/v1/financial/summary', () => {
  test('totals + per-category + per-month math is correct', async () => {
    const { agent } = await loginAs('admin');
    const seed = [
      { type: 'INCOME', amount: 1000, category: 'sales', date: new Date('2026-01-10') },
      { type: 'INCOME', amount: 500, category: 'sales', date: new Date('2026-01-20') },
      { type: 'EXPENSE', amount: 300, category: 'fuel', date: new Date('2026-01-25') },
      { type: 'INCOME', amount: 2000, category: 'sales', date: new Date('2026-02-05') },
      { type: 'EXPENSE', amount: 700, category: 'salary', date: new Date('2026-02-08') },
      { type: 'EXPENSE', amount: 100, category: 'fuel', date: new Date('2026-03-12') },
    ] as const;
    for (const r of seed) await factories.financialRecord(r);

    const res = await agent.get('/api/v1/financial/summary');
    expect(res.status).toBe(200);
    const { totalIncome, totalExpenses, profit, monthly, byCategory } = res.body.data;
    expect(totalIncome).toBe(3500);
    expect(totalExpenses).toBe(1100);
    expect(profit).toBe(2400);

    expect(monthly['2026-01']).toEqual({ income: 1500, expenses: 300, profit: 1200 });
    expect(monthly['2026-02']).toEqual({ income: 2000, expenses: 700, profit: 1300 });
    expect(monthly['2026-03']).toEqual({ income: 0, expenses: 100, profit: -100 });

    // byCategory groups by (category, type). Verify a known pair.
    const fuelExpense = byCategory.find(
      (g: { category: string; type: string }) => g.category === 'fuel' && g.type === 'EXPENSE',
    );
    expect(fuelExpense._sum.amount).toBe(400);
  });
});
