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

// Sweep: every list endpoint that scopes a soft-deletable model should hide
// rows where deletedAt is set. (Single-row /:id endpoints have known-divergent
// behavior — see tests/routes/users.test.ts for the explicit .failing test.)
describe('Cross-cutting: soft-delete sweep', () => {
  test('GET /users excludes soft-deleted users', async () => {
    const { agent } = await loginAs('admin');
    const live = await factories.resident();
    const dead = await factories.resident();
    await prisma.user.update({ where: { id: dead.id }, data: { deletedAt: new Date() } });
    const res = await agent.get('/api/v1/users');
    const ids = res.body.data.map((u: { id: string }) => u.id);
    expect(ids).toContain(live.id);
    expect(ids).not.toContain(dead.id);
  });

  test('GET /requests excludes soft-deleted requests', async () => {
    const { agent } = await loginAs('admin');
    const r = await factories.resident();
    const m = await factories.material();
    const live = await factories.pickupRequest({ residentId: r.id, materialId: m.id });
    const dead = await factories.pickupRequest({ residentId: r.id, materialId: m.id });
    await prisma.pickupRequest.update({
      where: { id: dead.id },
      data: { deletedAt: new Date() },
    });
    const res = await agent.get('/api/v1/requests');
    const ids = res.body.data.map((x: { id: string }) => x.id);
    expect(ids).toContain(live.id);
    expect(ids).not.toContain(dead.id);
  });

  test('GET /requests/:id 404s a soft-deleted request', async () => {
    const { agent } = await loginAs('admin');
    const r = await factories.resident();
    const m = await factories.material();
    const dead = await factories.pickupRequest({ residentId: r.id, materialId: m.id });
    await prisma.pickupRequest.update({
      where: { id: dead.id },
      data: { deletedAt: new Date() },
    });
    const res = await agent.get(`/api/v1/requests/${dead.id}`);
    expect(res.status).toBe(404);
  });
});
