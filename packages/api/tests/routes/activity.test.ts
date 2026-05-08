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

describe('GET /api/v1/activity', () => {
  test('admin receives the audit log paginated', async () => {
    // loginAs() writes its own auth.login row, so we filter on a marker action
    // we control to count exactly the rows we seed.
    const { agent } = await loginAs('admin');
    for (let i = 0; i < 5; i++) {
      await factories.activityLog({
        action: 'test.fixture',
        entityType: 'user',
        entityId: `user-${i}`,
        metadata: { i },
      });
    }
    const res = await agent.get('/api/v1/activity?action=test.fixture&limit=3&page=1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.total).toBe(5);
  });

  test('filters by action', async () => {
    const { agent } = await loginAs('admin');
    await factories.activityLog({ action: 'auth.login', entityType: 'user' });
    await factories.activityLog({ action: 'order.assigned', entityType: 'pickup_request' });
    const res = await agent.get('/api/v1/activity?action=order.assigned');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].action).toBe('order.assigned');
  });

  test('filters by entityType + entityId', async () => {
    const { agent } = await loginAs('admin');
    await factories.activityLog({
      action: 'order.assigned',
      entityType: 'pickup_request',
      entityId: 'req-A',
    });
    await factories.activityLog({
      action: 'order.assigned',
      entityType: 'pickup_request',
      entityId: 'req-B',
    });
    const res = await agent.get('/api/v1/activity?entityType=pickup_request&entityId=req-A');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].entityId).toBe('req-A');
  });

  test('filters by actorId', async () => {
    const { agent } = await loginAs('admin');
    await factories.activityLog({ action: 'x', entityType: 'user', actorId: 'a' });
    await factories.activityLog({ action: 'x', entityType: 'user', actorId: 'b' });
    const res = await agent.get('/api/v1/activity?actorId=a');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].actorId).toBe('a');
  });

  test('limit caps at 200 even when caller requests more', async () => {
    const { agent } = await loginAs('admin');
    for (let i = 0; i < 5; i++) {
      await factories.activityLog({ action: 'auth.login', entityType: 'user' });
    }
    const res = await agent.get('/api/v1/activity?limit=10000');
    // We only seeded 5 — but the pagination metadata should report the cap.
    expect(res.body.limit).toBeLessThanOrEqual(200);
  });

  test('non-admin → 403', async () => {
    const { agent } = await loginAs('worker');
    const res = await agent.get('/api/v1/activity');
    expect(res.status).toBe(403);
  });
});
