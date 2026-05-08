import request from 'supertest';
import app from '../../src/app';
import { prisma } from '@ekonaryn/db';
import { factories } from '../factories';
import { loginAs } from '../auth';
import { resetDb } from '../helpers';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const BAD_PHONES = [
  '+99670011', // too short
  '+9967001234567', // too long
  '+99670012345A', // letter in body
  '99670012345', // missing +
  '+1234567890', // wrong country
  '+ 996700123456', // space after +
] as const;

const GOOD_PHONE = '+996700123456';

describe('Cross-cutting: phone-format validation everywhere phone is accepted', () => {
  test.each(BAD_PHONES)('register rejects %s', async (phone) => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Phone Test',
      phone,
      password: 'pass1234',
    });
    expect(res.status).toBe(400);
  });

  test.each(BAD_PHONES)('register/resident rejects %s', async (phone) => {
    const res = await request(app).post('/api/v1/auth/register/resident').send({
      name: 'Phone Test',
      phone,
      password: 'pass1234',
    });
    expect(res.status).toBe(400);
  });

  test.each(BAD_PHONES)('login rejects %s', async (phone) => {
    const res = await request(app).post('/api/v1/auth/login').send({
      phone,
      password: 'whatever',
    });
    expect(res.status).toBe(400);
  });

  test.each(BAD_PHONES)('PUT /users/:id rejects %s', async (phone) => {
    const { user, agent } = await loginAs('admin');
    const res = await agent.put(`/api/v1/users/${user.id}`).send({ phone });
    expect(res.status).toBe(400);
  });

  test('register accepts the canonical good phone', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Phone Test',
      phone: GOOD_PHONE,
      password: 'pass1234',
    });
    expect(res.status).toBe(201);
  });
});
