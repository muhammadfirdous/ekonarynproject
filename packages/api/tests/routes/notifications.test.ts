import request from 'supertest';
import app from '../../src/app';
import { prisma } from '@ekonaryn/db';
import { loginAs, anonAgent } from '../auth';
import { resetDb } from '../helpers';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function seedNotifications(userId: string, count = 3) {
  // Create with explicit createdAt so ordering is deterministic.
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    await prisma.notification.create({
      data: {
        userId,
        title: `Title ${i}`,
        body: `Body ${i}`,
        read: false,
        createdAt: new Date(now - i * 60_000),
      },
    });
  }
}

describe('GET /api/v1/notifications', () => {
  test('unauthenticated → 401', async () => {
    const res = await anonAgent().get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });

  test('returns the current user notifications, newest first, capped at 50', async () => {
    const { user, agent } = await loginAs('resident');
    await seedNotifications(user.id, 3);

    const res = await agent.get('/api/v1/notifications');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].title).toBe('Title 0'); // newest
    expect(res.body.data[2].title).toBe('Title 2'); // oldest
  });

  test('does not leak another user notifications', async () => {
    const { user: alice } = await loginAs('resident', { phone: '+996700100100' });
    const { agent: bobAgent } = await loginAs('resident', { phone: '+996700100101' });
    await seedNotifications(alice.id, 5);

    const res = await bobAgent.get('/api/v1/notifications');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  test('caps at 50 even when more exist', async () => {
    const { user, agent } = await loginAs('resident');
    await seedNotifications(user.id, 60);

    const res = await agent.get('/api/v1/notifications');
    expect(res.body.data).toHaveLength(50);
  });
});

describe('POST /api/v1/notifications/:id/read', () => {
  test('unauthenticated → 401', async () => {
    const res = await request(app).post('/api/v1/notifications/some-id/read');
    expect(res.status).toBe(401);
  });

  test('marks the user own notification as read', async () => {
    const { user, agent } = await loginAs('resident');
    const n = await prisma.notification.create({
      data: { userId: user.id, title: 't', body: 'b', read: false },
    });

    const res = await agent.post(`/api/v1/notifications/${n.id}/read`);
    expect(res.status).toBe(200);

    const after = await prisma.notification.findUnique({ where: { id: n.id } });
    expect(after?.read).toBe(true);
  });

  test('returns 404 for someone else notification (no leak about existence)', async () => {
    const { user: alice } = await loginAs('resident', { phone: '+996700100100' });
    const { agent: bobAgent } = await loginAs('resident', { phone: '+996700100101' });
    const aliceNote = await prisma.notification.create({
      data: { userId: alice.id, title: 't', body: 'b', read: false },
    });

    const res = await bobAgent.post(`/api/v1/notifications/${aliceNote.id}/read`);
    expect(res.status).toBe(404);

    const after = await prisma.notification.findUnique({ where: { id: aliceNote.id } });
    expect(after?.read).toBe(false);
  });

  test('returns 404 for unknown id', async () => {
    const { agent } = await loginAs('resident');
    const res = await agent.post('/api/v1/notifications/00000000-0000-0000-0000-000000000000/read');
    expect(res.status).toBe(404);
  });
});
