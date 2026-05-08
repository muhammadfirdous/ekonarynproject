import { describe, expect, test } from 'vitest';
import {
  cn,
  setUtilLang,
  getUtilLang,
  formatDate,
  formatMoney,
  formatWeight,
  statusColors,
  getStatusLabel,
  statusLabels,
} from '@/lib/utils';

describe('cn (twMerge wrapper)', () => {
  test('joins class strings and de-dupes tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', false && 'text-lg', undefined, 'font-bold')).toBe('text-sm font-bold');
  });
});

describe('language module switch', () => {
  test('setUtilLang/getUtilLang round-trip', () => {
    setUtilLang('en');
    expect(getUtilLang()).toBe('en');
    setUtilLang('ru');
    expect(getUtilLang()).toBe('ru');
  });
});

describe('formatDate', () => {
  test('renders an English locale date when lang=en', () => {
    setUtilLang('en');
    const out = formatDate('2026-05-08T00:00:00.000Z');
    // Avoid pinning the exact string (varies by locale data) — just check it
    // contains a 4-digit year.
    expect(out).toMatch(/2026/);
  });

  test('switches to Russian formatting when lang=ru', () => {
    setUtilLang('ru');
    const out = formatDate('2026-05-08T00:00:00.000Z');
    expect(out).toMatch(/2026/);
  });
});

describe('formatMoney', () => {
  test('English uses "som"', () => {
    setUtilLang('en');
    expect(formatMoney(1234)).toMatch(/som/);
  });

  test('Russian uses "сом"', () => {
    setUtilLang('ru');
    expect(formatMoney(1234)).toMatch(/сом/);
  });
});

describe('formatWeight', () => {
  test('English unit "kg"', () => {
    setUtilLang('en');
    expect(formatWeight(7.456)).toBe('7.5 kg');
  });

  test('Russian unit "кг"', () => {
    setUtilLang('ru');
    expect(formatWeight(7.456)).toBe('7.5 кг');
  });
});

describe('statusColors map', () => {
  test('exposes a class string for every lifecycle status', () => {
    for (const s of [
      'pending',
      'accepted',
      'assigned',
      'in_progress',
      'completed',
      'cancelled',
      'rejected',
      'failed',
      'ACTIVE',
      'PENDING_APPROVAL',
      'REJECTED',
      'SUSPENDED',
    ]) {
      expect(typeof statusColors[s]).toBe('string');
      expect(statusColors[s].length).toBeGreaterThan(0);
    }
  });

  test('unknown status is undefined (caller falls back)', () => {
    expect(statusColors['nope']).toBeUndefined();
  });
});

describe('getStatusLabel + statusLabels proxy', () => {
  test('returns the language-specific label', () => {
    setUtilLang('en');
    expect(getStatusLabel('pending')).toBe('Pending');
    setUtilLang('ru');
    expect(getStatusLabel('pending')).toBe('Ожидает');
  });

  test('falls back to the raw key when unknown', () => {
    setUtilLang('en');
    expect(getStatusLabel('mystery')).toBe('mystery');
  });

  test('statusLabels proxy resolves the same value as getStatusLabel', () => {
    setUtilLang('en');
    expect(statusLabels['completed']).toBe(getStatusLabel('completed'));
  });
});
