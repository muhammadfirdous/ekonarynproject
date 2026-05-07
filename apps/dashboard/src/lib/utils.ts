import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Lang = 'ru' | 'en';
let currentLang: Lang = 'ru';

export function setUtilLang(l: Lang) {
  currentLang = l;
}

export function getUtilLang(): Lang {
  return currentLang;
}

export function formatDate(date: string | Date) {
  const locale = currentLang === 'ru' ? 'ru-RU' : 'en-US';
  return new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMoney(amount: number) {
  const locale = currentLang === 'ru' ? 'ru-RU' : 'en-US';
  const cur = currentLang === 'ru' ? 'сом' : 'som';
  return `${amount.toLocaleString(locale)} ${cur}`;
}

export function formatWeight(kg: number) {
  const u = currentLang === 'ru' ? 'кг' : 'kg';
  return `${kg.toFixed(1)} ${u}`;
}

export const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  ASSIGNED: 'bg-blue-50 text-blue-700 border border-blue-200',
  COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
};

const STATUS_LABELS: Record<Lang, Record<string, string>> = {
  ru: {
    PENDING: 'Ожидает',
    ASSIGNED: 'Назначен',
    COMPLETED: 'Завершен',
    CANCELLED: 'Отменен',
  },
  en: {
    PENDING: 'Pending',
    ASSIGNED: 'Assigned',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  },
};

export function getStatusLabel(s: string): string {
  return STATUS_LABELS[currentLang][s] || s;
}

/**
 * Backwards-compatible accessor that resolves status labels in the current language.
 * Use this exactly like the previous `statusLabels[status]`.
 */
export const statusLabels: Record<string, string> = new Proxy(
  {},
  {
    get: (_target, key: string) => getStatusLabel(key),
  },
) as Record<string, string>;
