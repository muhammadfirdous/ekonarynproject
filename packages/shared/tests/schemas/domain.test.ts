import { describe, expect, test } from 'vitest';
import {
  materialSchema,
  pickupRequestSchema,
  updateRequestStatusSchema,
  assignOrderSchema,
  collectionSchema,
  tripSchema,
  routeSchema,
  financialRecordSchema,
  scheduleSchema,
  updateUserSchema,
} from '../../src/schemas';
import { ORDER_STATUSES, ACCOUNT_STATUSES } from '../../src/types';

const UUID = '11111111-1111-1111-1111-111111111111';
const VALID_PHONE = '+996700123456';
const ISO_NOW = new Date().toISOString();

describe('schemas/materialSchema', () => {
  const valid = {
    name: 'PET',
    nameKy: 'ПЭТ',
    nameRu: 'ПЭТ',
    buyingPrice: 5,
    sellingPrice: 10,
  };

  test('minimum valid (unit defaults to "kg")', () => {
    const r = materialSchema.parse(valid);
    expect(r.unit).toBe('kg');
  });

  test('description and imageUrl are optional but validated when present', () => {
    expect(
      materialSchema.safeParse({ ...valid, description: 'desc', imageUrl: 'https://x.com/y.png' })
        .success,
    ).toBe(true);
    expect(materialSchema.safeParse({ ...valid, imageUrl: 'not-a-url' }).success).toBe(false);
  });

  test.each([
    ['name empty', { ...valid, name: '' }],
    ['nameKy empty', { ...valid, nameKy: '' }],
    ['nameRu empty', { ...valid, nameRu: '' }],
    ['buyingPrice 0', { ...valid, buyingPrice: 0 }],
    ['buyingPrice negative', { ...valid, buyingPrice: -1 }],
    ['sellingPrice 0', { ...valid, sellingPrice: 0 }],
  ])('rejects %s', (_l, input) => {
    expect(materialSchema.safeParse(input).success).toBe(false);
  });
});

describe('schemas/pickupRequestSchema', () => {
  const valid = { materialId: UUID, address: 'Center', estimatedQty: 5 };

  test('minimum valid; notes optional', () => {
    expect(pickupRequestSchema.parse(valid)).toMatchObject(valid);
    expect(pickupRequestSchema.parse({ ...valid, notes: 'pls call' }).notes).toBe('pls call');
  });

  test.each([
    ['materialId not uuid', { ...valid, materialId: 'no' }],
    ['address empty', { ...valid, address: '' }],
    ['estimatedQty 0', { ...valid, estimatedQty: 0 }],
    ['estimatedQty negative', { ...valid, estimatedQty: -3 }],
  ])('rejects %s', (_l, input) => {
    expect(pickupRequestSchema.safeParse(input).success).toBe(false);
  });
});

describe('schemas/updateRequestStatusSchema', () => {
  test.each(ORDER_STATUSES)('accepts every lifecycle status: %s', (s) => {
    expect(updateRequestStatusSchema.parse({ status: s }).status).toBe(s);
  });

  test('rejects unknown status', () => {
    expect(updateRequestStatusSchema.safeParse({ status: 'mystery' }).success).toBe(false);
  });

  test('reason is optional', () => {
    expect(
      updateRequestStatusSchema.parse({ status: 'cancelled', reason: 'changed mind' }).reason,
    ).toBe('changed mind');
  });
});

describe('schemas/assignOrderSchema', () => {
  test('valid', () => {
    expect(assignOrderSchema.parse({ workerId: UUID }).workerId).toBe(UUID);
  });

  test('rejects non-uuid', () => {
    expect(assignOrderSchema.safeParse({ workerId: 'no' }).success).toBe(false);
  });
});

describe('schemas/collectionSchema', () => {
  const valid = { requestId: UUID, materialId: UUID, actualWeightKg: 5 };

  test('minimum valid', () => {
    expect(collectionSchema.parse(valid)).toMatchObject(valid);
  });

  test('actualWeightKg must be positive', () => {
    expect(collectionSchema.safeParse({ ...valid, actualWeightKg: 0 }).success).toBe(false);
    expect(collectionSchema.safeParse({ ...valid, actualWeightKg: 0.001 }).success).toBe(true);
  });
});

describe('schemas/tripSchema', () => {
  test('minimum valid (destination defaults to Bishkek)', () => {
    const r = tripSchema.parse({ date: ISO_NOW });
    expect(r.destination).toBe('Bishkek');
  });

  test('totals must be >= 0 if present', () => {
    expect(
      tripSchema.safeParse({ date: ISO_NOW, totalWeightKg: 0, transportCost: 0, revenue: 0 })
        .success,
    ).toBe(true);
    expect(tripSchema.safeParse({ date: ISO_NOW, totalWeightKg: -1 }).success).toBe(false);
  });

  test('collectionIds must be uuid array', () => {
    expect(tripSchema.safeParse({ date: ISO_NOW, collectionIds: [UUID] }).success).toBe(true);
    expect(tripSchema.safeParse({ date: ISO_NOW, collectionIds: ['no'] }).success).toBe(false);
  });

  test('rejects bad date string', () => {
    expect(tripSchema.safeParse({ date: 'yesterday' }).success).toBe(false);
  });
});

describe('schemas/routeSchema', () => {
  const valid = {
    workerId: UUID,
    date: ISO_NOW,
    stops: [{ address: 'Center', order: 1 }],
  };

  test('minimum valid', () => {
    expect(routeSchema.parse(valid).stops).toHaveLength(1);
  });

  test('stop requires address and order', () => {
    expect(routeSchema.safeParse({ ...valid, stops: [{ address: '', order: 1 }] }).success).toBe(
      true,
    ); // address has no min(1) constraint here
    expect(routeSchema.safeParse({ ...valid, stops: [{ order: 1 }] }).success).toBe(false);
    expect(routeSchema.safeParse({ ...valid, stops: [{ address: 'X' }] }).success).toBe(false);
  });

  test('stop.requestId optional but validated when present', () => {
    expect(
      routeSchema.safeParse({
        ...valid,
        stops: [{ address: 'X', order: 1, requestId: UUID, notes: 'hi' }],
      }).success,
    ).toBe(true);
    expect(
      routeSchema.safeParse({ ...valid, stops: [{ address: 'X', order: 1, requestId: 'no' }] })
        .success,
    ).toBe(false);
  });
});

describe('schemas/financialRecordSchema', () => {
  test.each(['INCOME', 'EXPENSE'])('accepts type %s', (type) => {
    expect(
      financialRecordSchema.parse({
        type,
        amount: 100,
        description: 'x',
        date: ISO_NOW,
      }).type,
    ).toBe(type);
  });

  test('amount must be positive; description non-empty', () => {
    const base = { type: 'INCOME' as const, amount: 10, description: 'x', date: ISO_NOW };
    expect(financialRecordSchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
    expect(financialRecordSchema.safeParse({ ...base, description: '' }).success).toBe(false);
  });

  test('rejects unknown type', () => {
    expect(
      financialRecordSchema.safeParse({
        type: 'TRANSFER',
        amount: 10,
        description: 'x',
        date: ISO_NOW,
      }).success,
    ).toBe(false);
  });
});

describe('schemas/scheduleSchema', () => {
  test.each([0, 6])('dayOfWeek boundary %i ok', (d) => {
    expect(scheduleSchema.parse({ area: 'C', dayOfWeek: d, time: '09:00' }).active).toBe(true);
  });

  test.each([-1, 7, 1.5])('dayOfWeek %p rejected', (d) => {
    expect(scheduleSchema.safeParse({ area: 'C', dayOfWeek: d, time: '09:00' }).success).toBe(
      false,
    );
  });

  // Production regex is purely structural: ^\d{2}:\d{2}$. Rejects anything that
  // isn't HH:MM-shaped but does NOT reject semantically-invalid times like
  // 24:00 or 12:60. The .todo below tracks the gap.
  test.each(['9:00', 'noon', '12:5', '00:5', 'aa:bb', '0900'])('rejects malformed time %s', (t) => {
    expect(scheduleSchema.safeParse({ area: 'C', dayOfWeek: 1, time: t }).success).toBe(false);
  });

  test('current behavior: structurally valid but semantically silly times pass', () => {
    expect(scheduleSchema.safeParse({ area: 'C', dayOfWeek: 1, time: '24:00' }).success).toBe(true);
    expect(scheduleSchema.safeParse({ area: 'C', dayOfWeek: 1, time: '12:60' }).success).toBe(true);
  });

  test.todo('FUTURE: scheduleSchema should reject hour > 23 or minute > 59');

  test('area must be non-empty', () => {
    expect(scheduleSchema.safeParse({ area: '', dayOfWeek: 1, time: '09:00' }).success).toBe(false);
  });

  test('active defaults to true; can be set false', () => {
    expect(scheduleSchema.parse({ area: 'C', dayOfWeek: 1, time: '09:00' }).active).toBe(true);
    expect(
      scheduleSchema.parse({ area: 'C', dayOfWeek: 1, time: '09:00', active: false }).active,
    ).toBe(false);
  });
});

describe('schemas/updateUserSchema', () => {
  test('every field is optional (empty {} is valid)', () => {
    expect(updateUserSchema.parse({})).toEqual({});
  });

  test('email validated when present', () => {
    expect(updateUserSchema.safeParse({ email: 'no' }).success).toBe(false);
    expect(updateUserSchema.safeParse({ email: 'a@b.co' }).success).toBe(true);
  });

  test.each(ACCOUNT_STATUSES)('accountStatus accepts %s', (s) => {
    expect(updateUserSchema.parse({ accountStatus: s }).accountStatus).toBe(s);
  });

  test('rejects bad accountStatus', () => {
    expect(updateUserSchema.safeParse({ accountStatus: 'maybe' }).success).toBe(false);
  });

  test.each(['ADMIN', 'WORKER', 'RESIDENT'])('role accepts %s', (r) => {
    expect(updateUserSchema.parse({ role: r }).role).toBe(r);
  });

  test('phone validated when present', () => {
    expect(updateUserSchema.safeParse({ phone: VALID_PHONE }).success).toBe(true);
    expect(updateUserSchema.safeParse({ phone: 'no' }).success).toBe(false);
  });

  test('vehicleCapacityKg / maxConcurrentOrders must be positive when present', () => {
    expect(updateUserSchema.safeParse({ vehicleCapacityKg: 0 }).success).toBe(false);
    expect(updateUserSchema.safeParse({ maxConcurrentOrders: 0 }).success).toBe(false);
    expect(updateUserSchema.safeParse({ maxConcurrentOrders: 1.5 }).success).toBe(false);
    expect(updateUserSchema.safeParse({ maxConcurrentOrders: 3 }).success).toBe(true);
  });

  test('serviceAreas can be a string array', () => {
    expect(updateUserSchema.safeParse({ serviceAreas: ['a', 'b'] }).success).toBe(true);
  });
});
