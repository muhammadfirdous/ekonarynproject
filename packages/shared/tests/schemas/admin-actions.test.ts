import { describe, expect, test } from 'vitest';
import { rejectWorkerSchema, suspendWorkerSchema, reactivateWorkerSchema } from '../../src/schemas';

describe('schemas/rejectWorkerSchema', () => {
  test('reason min length 3', () => {
    expect(rejectWorkerSchema.safeParse({ reason: 'no' }).success).toBe(false);
    expect(rejectWorkerSchema.parse({ reason: 'bad documents' }).reason).toBe('bad documents');
  });

  test('reason is required', () => {
    expect(rejectWorkerSchema.safeParse({}).success).toBe(false);
  });
});

describe('schemas/suspendWorkerSchema', () => {
  test('reason min length 3', () => {
    expect(suspendWorkerSchema.safeParse({ reason: 'ab' }).success).toBe(false);
    expect(suspendWorkerSchema.parse({ reason: 'complaint' }).reason).toBe('complaint');
  });

  test('reason is required', () => {
    expect(suspendWorkerSchema.safeParse({}).success).toBe(false);
  });
});

describe('schemas/reactivateWorkerSchema', () => {
  test('reason is optional', () => {
    expect(reactivateWorkerSchema.parse({})).toEqual({});
    expect(reactivateWorkerSchema.parse({ reason: 'cleared' }).reason).toBe('cleared');
  });
});
