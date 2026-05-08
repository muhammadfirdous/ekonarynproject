import { describe, expect, test } from 'vitest';
import {
  registerSchema,
  residentRegisterSchema,
  workerRegisterSchema,
  verifyCodeSchema,
  resendCodeSchema,
  loginSchema,
} from '../../src/schemas';

const VALID_PHONE = '+996700123456';
const TOO_SHORT_PHONE = '+99670012345'; // 8 digits after +996
const TOO_LONG_PHONE = '+9967001234567'; // 10 digits after +996

describe('schemas/registerSchema (legacy resident)', () => {
  test('minimum valid input passes', () => {
    expect(
      registerSchema.parse({ name: 'Aibek', phone: VALID_PHONE, password: 'pass1234' }),
    ).toMatchObject({ name: 'Aibek', phone: VALID_PHONE });
  });

  test('address is optional', () => {
    const r = registerSchema.parse({
      name: 'Aibek',
      phone: VALID_PHONE,
      password: 'pass1234',
      address: 'Center 1',
    });
    expect(r.address).toBe('Center 1');
  });

  test.each([
    ['name missing', { phone: VALID_PHONE, password: 'pass1234' }],
    ['name 1 char', { name: 'X', phone: VALID_PHONE, password: 'pass1234' }],
    ['name 101 chars', { name: 'X'.repeat(101), phone: VALID_PHONE, password: 'pass1234' }],
    ['phone missing', { name: 'A', password: 'pass1234' }],
    ['phone short', { name: 'Aibek', phone: TOO_SHORT_PHONE, password: 'pass1234' }],
    ['phone long', { name: 'Aibek', phone: TOO_LONG_PHONE, password: 'pass1234' }],
    ['phone wrong country', { name: 'Aibek', phone: '+1234567890', password: 'pass1234' }],
    ['password missing', { name: 'Aibek', phone: VALID_PHONE }],
    ['password 5 chars', { name: 'Aibek', phone: VALID_PHONE, password: 'short' }],
    ['password 101 chars', { name: 'Aibek', phone: VALID_PHONE, password: 'p'.repeat(101) }],
  ])('rejects %s', (_label, input) => {
    expect(registerSchema.safeParse(input).success).toBe(false);
  });

  test('boundary: name 2 chars and 100 chars accepted', () => {
    expect(
      registerSchema.safeParse({ name: 'AB', phone: VALID_PHONE, password: 'pass1234' }).success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({
        name: 'A'.repeat(100),
        phone: VALID_PHONE,
        password: 'pass1234',
      }).success,
    ).toBe(true);
  });

  test('boundary: password 6 chars and 100 chars accepted', () => {
    expect(
      registerSchema.safeParse({ name: 'Aibek', phone: VALID_PHONE, password: '123456' }).success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({
        name: 'Aibek',
        phone: VALID_PHONE,
        password: 'p'.repeat(100),
      }).success,
    ).toBe(true);
  });
});

describe('schemas/residentRegisterSchema', () => {
  test('email is optional', () => {
    expect(
      residentRegisterSchema.parse({
        name: 'Resident',
        phone: VALID_PHONE,
        password: 'pass1234',
      }),
    ).not.toHaveProperty('email');
  });

  test('email validates as RFC 5322', () => {
    expect(
      residentRegisterSchema.safeParse({
        name: 'Resident',
        phone: VALID_PHONE,
        password: 'pass1234',
        email: 'not-an-email',
      }).success,
    ).toBe(false);
    expect(
      residentRegisterSchema.safeParse({
        name: 'Resident',
        phone: VALID_PHONE,
        password: 'pass1234',
        email: 'a@b.co',
      }).success,
    ).toBe(true);
  });
});

describe('schemas/workerRegisterSchema', () => {
  const valid = {
    name: 'Worker',
    phone: VALID_PHONE,
    password: 'pass1234',
    idNumber: 'AN1234567',
    serviceAreas: ['Center'],
    vehicleType: 'pickup',
    vehiclePlate: '01KG123ABC',
    vehicleCapacityKg: 600,
  };

  test('minimum valid', () => {
    expect(workerRegisterSchema.parse(valid)).toMatchObject({ name: 'Worker' });
  });

  test('idNumber min length 3', () => {
    expect(workerRegisterSchema.safeParse({ ...valid, idNumber: 'AB' }).success).toBe(false);
    expect(workerRegisterSchema.safeParse({ ...valid, idNumber: 'ABC' }).success).toBe(true);
  });

  test('idNumber max length 50', () => {
    expect(workerRegisterSchema.safeParse({ ...valid, idNumber: 'A'.repeat(51) }).success).toBe(
      false,
    );
    expect(workerRegisterSchema.safeParse({ ...valid, idNumber: 'A'.repeat(50) }).success).toBe(
      true,
    );
  });

  test('serviceAreas must be a non-empty array of non-empty strings', () => {
    expect(workerRegisterSchema.safeParse({ ...valid, serviceAreas: [] }).success).toBe(false);
    expect(workerRegisterSchema.safeParse({ ...valid, serviceAreas: [''] }).success).toBe(false);
    expect(workerRegisterSchema.safeParse({ ...valid, serviceAreas: undefined }).success).toBe(
      false,
    );
  });

  test('vehiclePlate max length 20', () => {
    expect(workerRegisterSchema.safeParse({ ...valid, vehiclePlate: 'A'.repeat(21) }).success).toBe(
      false,
    );
    expect(workerRegisterSchema.safeParse({ ...valid, vehiclePlate: 'A'.repeat(20) }).success).toBe(
      true,
    );
  });

  test('vehicleCapacityKg must be > 0', () => {
    expect(workerRegisterSchema.safeParse({ ...valid, vehicleCapacityKg: 0 }).success).toBe(false);
    expect(workerRegisterSchema.safeParse({ ...valid, vehicleCapacityKg: -1 }).success).toBe(false);
    expect(workerRegisterSchema.safeParse({ ...valid, vehicleCapacityKg: 0.1 }).success).toBe(true);
  });

  test('email is optional but validated when present', () => {
    expect(workerRegisterSchema.safeParse({ ...valid, email: 'a@b.co' }).success).toBe(true);
    expect(workerRegisterSchema.safeParse({ ...valid, email: 'no' }).success).toBe(false);
  });
});

describe('schemas/verifyCodeSchema', () => {
  test('valid code shape', () => {
    expect(verifyCodeSchema.parse({ phone: VALID_PHONE, code: '123456' })).toBeTruthy();
  });

  test.each([
    ['code wrong length', { phone: VALID_PHONE, code: '12345' }],
    ['code letters', { phone: VALID_PHONE, code: 'abcdef' }],
    ['code 7 digits', { phone: VALID_PHONE, code: '1234567' }],
    ['phone wrong format', { phone: 'bad', code: '123456' }],
  ])('rejects %s', (_l, input) => {
    expect(verifyCodeSchema.safeParse(input).success).toBe(false);
  });
});

describe('schemas/resendCodeSchema', () => {
  test('valid', () => {
    expect(resendCodeSchema.parse({ phone: VALID_PHONE })).toEqual({ phone: VALID_PHONE });
  });

  test('rejects bad phone', () => {
    expect(resendCodeSchema.safeParse({ phone: 'no' }).success).toBe(false);
  });
});

describe('schemas/loginSchema', () => {
  test('valid', () => {
    expect(loginSchema.parse({ phone: VALID_PHONE, password: 'x' })).toEqual({
      phone: VALID_PHONE,
      password: 'x',
    });
  });

  test('rejects empty password (min(1))', () => {
    expect(loginSchema.safeParse({ phone: VALID_PHONE, password: '' }).success).toBe(false);
  });

  test('rejects bad phone', () => {
    expect(loginSchema.safeParse({ phone: 'no', password: 'x' }).success).toBe(false);
  });
});
