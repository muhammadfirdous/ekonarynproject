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
  // Legacy uppercase aliases (kept so older data still renders correctly).
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  ASSIGNED: 'bg-blue-50 text-blue-700 border border-blue-200',
  COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
  // Lifecycle vocabulary.
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  accepted: 'bg-sky-50 text-sky-700 border border-sky-200',
  assigned: 'bg-blue-50 text-blue-700 border border-blue-200',
  in_progress: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
  rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
  failed: 'bg-orange-50 text-orange-700 border border-orange-200',
  // Account statuses.
  ACTIVE: 'bg-green-50 text-green-700 border border-green-200',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border border-amber-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
  SUSPENDED: 'bg-red-50 text-red-700 border border-red-200',
};

const STATUS_LABELS: Record<Lang, Record<string, string>> = {
  ru: {
    PENDING: 'Ожидает',
    ASSIGNED: 'Назначен',
    COMPLETED: 'Завершен',
    CANCELLED: 'Отменен',
    pending: 'Ожидает',
    accepted: 'Принят',
    assigned: 'Назначен',
    in_progress: 'В работе',
    completed: 'Завершен',
    cancelled: 'Отменен',
    rejected: 'Отклонен',
    failed: 'Не удался',
    ACTIVE: 'Активен',
    PENDING_APPROVAL: 'На рассмотрении',
    REJECTED: 'Отклонен',
    SUSPENDED: 'Заблокирован',
  },
  en: {
    PENDING: 'Pending',
    ASSIGNED: 'Assigned',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    pending: 'Pending',
    accepted: 'Accepted',
    assigned: 'Assigned',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
    failed: 'Failed',
    ACTIVE: 'Active',
    PENDING_APPROVAL: 'Pending approval',
    REJECTED: 'Rejected',
    SUSPENDED: 'Suspended',
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
