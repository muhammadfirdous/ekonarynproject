import { describe, expect, test } from 'vitest';
import * as shared from '../src';

// Sanity check that the public surface re-exports the expected pieces from
// types, constants, and schemas. If a future PR drops a re-export, this test
// catches it without needing to update every consumer.
describe('public surface (src/index.ts)', () => {
  test.each([
    'Role',
    'AccountStatus',
    'OrderStatus',
    'ActivityAction',
    'COLORS',
    'AREAS_NARYN',
    'API_VERSION',
    'registerSchema',
    'residentRegisterSchema',
    'workerRegisterSchema',
    'verifyCodeSchema',
    'loginSchema',
    'pickupRequestSchema',
    'updateRequestStatusSchema',
    'assignOrderSchema',
    'collectionSchema',
    'tripSchema',
    'routeSchema',
    'financialRecordSchema',
    'scheduleSchema',
    'updateUserSchema',
    'rejectWorkerSchema',
    'suspendWorkerSchema',
    'reactivateWorkerSchema',
  ])('re-exports %s', (name) => {
    expect((shared as Record<string, unknown>)[name]).toBeDefined();
  });
});
