import fc from 'fast-check';
import { OrderStatus } from '@ekonaryn/shared';
import {
  allowedNextStates,
  assertTransition,
  canTransition,
  isOrderStatus,
} from '../../src/services/orderState';
import { AppError } from '../../src/middleware/error';

// Authoritative table — must match src/services/orderState.ts:7-22.
// Tests here re-state the table to catch drift; if the production table
// changes, this test must be updated explicitly.
const LEGAL: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED, OrderStatus.REJECTED],
  [OrderStatus.ACCEPTED]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED, OrderStatus.REJECTED],
  [OrderStatus.ASSIGNED]: [
    OrderStatus.IN_PROGRESS,
    OrderStatus.CANCELLED,
    OrderStatus.REJECTED,
    OrderStatus.FAILED,
  ],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.FAILED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.FAILED]: [],
};

const ALL_STATUSES = Object.values(OrderStatus) as OrderStatus[];
const TERMINALS: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.REJECTED,
  OrderStatus.FAILED,
];

describe('services/orderState', () => {
  describe('isOrderStatus', () => {
    test.each(ALL_STATUSES)('accepts the lifecycle value %s', (s) => {
      expect(isOrderStatus(s)).toBe(true);
    });

    test.each(['PENDING', 'unknown', '', null, undefined, 42, {}])(
      'rejects non-lifecycle value %p',
      (v) => {
        expect(isOrderStatus(v)).toBe(false);
      },
    );
  });

  describe('canTransition / allowedNextStates', () => {
    for (const from of ALL_STATUSES) {
      for (const to of LEGAL[from]) {
        test(`legal: ${from} -> ${to}`, () => {
          expect(canTransition(from, to)).toBe(true);
        });
      }
      test(`allowedNextStates(${from}) returns the table`, () => {
        expect(allowedNextStates(from).sort()).toEqual([...LEGAL[from]].sort());
      });
    }

    // Direct branch coverage for the bad-input short-circuits in
    // canTransition / allowedNextStates.
    test('canTransition: bad source returns false', () => {
      expect(canTransition('bogus', OrderStatus.PENDING)).toBe(false);
    });

    test('canTransition: bad target returns false', () => {
      expect(canTransition(OrderStatus.PENDING, 'bogus')).toBe(false);
    });

    test('allowedNextStates: bad source returns []', () => {
      expect(allowedNextStates('bogus')).toEqual([]);
    });
  });

  describe('assertTransition', () => {
    for (const from of ALL_STATUSES) {
      for (const to of LEGAL[from]) {
        test(`accepts ${from} -> ${to}`, () => {
          expect(() => assertTransition(from, to)).not.toThrow();
        });
      }
    }

    test('every illegal pair throws AppError(409) listing the allowed next states', () => {
      for (const from of ALL_STATUSES) {
        const allowed = LEGAL[from];
        for (const to of ALL_STATUSES) {
          if (allowed.includes(to)) continue;
          let caught: unknown = null;
          try {
            assertTransition(from, to);
          } catch (err) {
            caught = err;
          }
          expect(caught).toBeInstanceOf(AppError);
          const e = caught as AppError;
          expect(e.statusCode).toBe(409);
          expect(e.message).toContain(`${from} → ${to}`);
          if (allowed.length === 0) {
            expect(e.message).toMatch(/terminal/);
          } else {
            // Each allowed next state should appear in the error message.
            for (const a of allowed) {
              expect(e.message).toContain(a);
            }
          }
        }
      }
    });

    test.each(TERMINALS)('terminal state %s cannot transition anywhere', (term) => {
      for (const to of ALL_STATUSES) {
        expect(() => assertTransition(term, to)).toThrow(AppError);
      }
    });

    test('self-transition pending → pending is rejected (status not in allowed-next)', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PENDING)).toThrow(AppError);
    });

    test('unknown source status throws 400 (not 409)', () => {
      let caught: AppError | null = null;
      try {
        assertTransition('mystery' as OrderStatus, OrderStatus.PENDING);
      } catch (err) {
        caught = err as AppError;
      }
      expect(caught).toBeInstanceOf(AppError);
      expect(caught!.statusCode).toBe(400);
    });

    test('unknown target status throws 400 (not 409)', () => {
      let caught: AppError | null = null;
      try {
        assertTransition(OrderStatus.PENDING, 'mystery' as OrderStatus);
      } catch (err) {
        caught = err as AppError;
      }
      expect(caught).toBeInstanceOf(AppError);
      expect(caught!.statusCode).toBe(400);
    });

    // Property-based: for any pair NOT in the transition table, assertTransition
    // throws and canTransition is false. Coverage is exhaustive across the 64
    // pairs but fast-check also stress-tests the boolean shape under shrinking.
    test('property: any non-table pair fails', () => {
      const arb = fc.constantFrom(...ALL_STATUSES);
      fc.assert(
        fc.property(arb, arb, (from, to) => {
          const isLegal = LEGAL[from].includes(to);
          if (isLegal) {
            // Sanity check: the table allows it, so canTransition agrees.
            return canTransition(from, to);
          }
          // Not in the table => must throw and canTransition must say no.
          if (canTransition(from, to)) return false;
          try {
            assertTransition(from, to);
            return false; // should have thrown
          } catch (err) {
            return err instanceof AppError;
          }
        }),
        { numRuns: 200 },
      );
    });
  });
});
