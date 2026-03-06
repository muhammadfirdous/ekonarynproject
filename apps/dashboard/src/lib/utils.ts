import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMoney(amount: number) {
  return `${amount.toLocaleString('ru-RU')} сом`;
}

export function formatWeight(kg: number) {
  return `${kg.toFixed(1)} кг`;
}

export const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  ASSIGNED: 'bg-blue-50 text-blue-700 border border-blue-200',
  COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
};

export const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает',
  ASSIGNED: 'Назначен',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен',
};
