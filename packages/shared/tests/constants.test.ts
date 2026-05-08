import { describe, expect, test } from 'vitest';
import {
  COLORS,
  DAYS_OF_WEEK,
  DAYS_OF_WEEK_RU,
  AREAS_NARYN,
  API_VERSION,
  DEFAULT_PAGE_SIZE,
  MAX_FILE_SIZE,
} from '../src/constants';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

describe('constants/COLORS', () => {
  test('every brand color is a valid 6-digit hex string', () => {
    for (const [key, value] of Object.entries(COLORS)) {
      expect(value, `COLORS.${key}`).toMatch(HEX_RE);
    }
  });

  test('exposes the canonical brand palette keys', () => {
    expect(Object.keys(COLORS)).toEqual(
      expect.arrayContaining([
        'primary',
        'primary2',
        'accent',
        'light',
        'background',
        'text',
        'gray',
      ]),
    );
  });
});

describe('constants/day-name arrays', () => {
  test('DAYS_OF_WEEK has exactly 7 entries (Kyrgyz)', () => {
    expect(DAYS_OF_WEEK).toHaveLength(7);
    for (const d of DAYS_OF_WEEK) expect(typeof d).toBe('string');
  });

  test('DAYS_OF_WEEK_RU has exactly 7 entries (Russian)', () => {
    expect(DAYS_OF_WEEK_RU).toHaveLength(7);
    for (const d of DAYS_OF_WEEK_RU) expect(typeof d).toBe('string');
  });

  test('parallel arrays have matching lengths', () => {
    expect(DAYS_OF_WEEK.length).toBe(DAYS_OF_WEEK_RU.length);
  });
});

describe('constants/AREAS_NARYN', () => {
  test('non-empty list of unique non-empty strings', () => {
    expect(AREAS_NARYN.length).toBeGreaterThan(0);
    const set = new Set(AREAS_NARYN);
    expect(set.size).toBe(AREAS_NARYN.length);
    for (const a of AREAS_NARYN) expect(a).not.toBe('');
  });
});

describe('constants/scalars', () => {
  test('API_VERSION is a non-empty string', () => {
    expect(typeof API_VERSION).toBe('string');
    expect(API_VERSION.length).toBeGreaterThan(0);
  });

  test('DEFAULT_PAGE_SIZE is a positive integer', () => {
    expect(Number.isInteger(DEFAULT_PAGE_SIZE)).toBe(true);
    expect(DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
  });

  test('MAX_FILE_SIZE is 10 MB in bytes', () => {
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
  });
});
