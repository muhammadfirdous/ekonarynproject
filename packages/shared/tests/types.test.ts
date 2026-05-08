import { describe, expect, expectTypeOf, test } from 'vitest';
import {
  Role,
  AccountStatus,
  OrderStatus,
  RequestStatus,
  ActivityAction,
  FinancialType,
  ORDER_STATUSES,
  ACCOUNT_STATUSES,
  ACTIVE_WORKER_STATUSES,
  type User,
  type PickupRequest,
  type AuthTokens,
  type ApiResponse,
  type PaginatedResponse,
} from '../src/types';

describe('types/Role', () => {
  test('has the three expected values', () => {
    expect(Object.values(Role).sort()).toEqual(['ADMIN', 'RESIDENT', 'WORKER']);
  });
});

describe('types/AccountStatus', () => {
  test('matches ACCOUNT_STATUSES tuple', () => {
    expect(Object.values(AccountStatus).sort()).toEqual([...ACCOUNT_STATUSES].sort());
  });

  test('ACTIVE_WORKER_STATUSES is exactly [ACTIVE]', () => {
    expect(ACTIVE_WORKER_STATUSES).toEqual([AccountStatus.ACTIVE]);
  });
});

describe('types/OrderStatus', () => {
  test('matches ORDER_STATUSES tuple', () => {
    expect(Object.values(OrderStatus).sort()).toEqual([...ORDER_STATUSES].sort());
  });

  test('values are lowercase', () => {
    for (const s of Object.values(OrderStatus)) expect(s).toBe(String(s).toLowerCase());
  });
});

describe('types/RequestStatus (legacy alias)', () => {
  test('still exposes pending/assigned/completed/cancelled', () => {
    expect(Object.values(RequestStatus)).toEqual(['pending', 'assigned', 'completed', 'cancelled']);
  });
});

describe('types/ActivityAction', () => {
  test('every value is a dot-separated namespace', () => {
    for (const a of Object.values(ActivityAction)) expect(a).toMatch(/^[a-z]+\.[a-z_]+$/);
  });

  test('contains the audit-action contract: at least the canonical 12 actions', () => {
    expect(Object.values(ActivityAction).length).toBeGreaterThanOrEqual(12);
  });
});

describe('types/FinancialType', () => {
  test('exactly INCOME and EXPENSE', () => {
    expect(Object.values(FinancialType).sort()).toEqual(['EXPENSE', 'INCOME']);
  });
});

// ─── Type-level assertions (no runtime cost) ─────────────────────────────────
describe('types/structural shape (compile-time checks)', () => {
  test('User shape has the public projection fields', () => {
    expectTypeOf<User>().toHaveProperty('id');
    expectTypeOf<User>().toHaveProperty('phone');
    expectTypeOf<User>().toHaveProperty('role');
    expectTypeOf<User>().toHaveProperty('accountStatus');
    expectTypeOf<User>().toHaveProperty('points');
    // Worker-specific fields are present and nullable.
    expectTypeOf<User['vehicleCapacityKg']>().toEqualTypeOf<number | null | undefined>();
    expectTypeOf<User['onShift']>().toEqualTypeOf<boolean | undefined>();
  });

  test('PickupRequest exposes the lifecycle status as string-or-enum', () => {
    expectTypeOf<PickupRequest['status']>().toEqualTypeOf<OrderStatus | string>();
    expectTypeOf<PickupRequest>().toHaveProperty('assignedWorkerId');
  });

  test('AuthTokens shape', () => {
    expectTypeOf<AuthTokens>().toEqualTypeOf<{ accessToken: string; refreshToken: string }>();
  });

  test('ApiResponse<T> envelope', () => {
    expectTypeOf<ApiResponse<{ id: string }>>().toMatchTypeOf<{ success: boolean }>();
  });

  test('PaginatedResponse<T> extends ApiResponse with pagination fields', () => {
    expectTypeOf<PaginatedResponse<{ id: string }>>().toMatchTypeOf<{
      success: boolean;
      total: number;
      page: number;
      limit: number;
    }>();
  });
});
