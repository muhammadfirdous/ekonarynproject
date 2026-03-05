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
  PENDING: 'bg-yellow-100 text-yellow-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает',
  ASSIGNED: 'Назначен',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен',
};
