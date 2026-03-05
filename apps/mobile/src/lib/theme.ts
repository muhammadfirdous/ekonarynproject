export const colors = {
  primary: '#1B5E20',
  primary2: '#2E7D32',
  accent: '#4CAF50',
  light: '#E8F5E9',
  background: '#F9F9F4',
  text: '#1C2A1C',
  gray: '#546E7A',
  white: '#FFFFFF',
  error: '#D32F2F',
  border: '#E0E0E0',
};

export const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FFF9C4', text: '#F9A825' },
  ASSIGNED: { bg: '#BBDEFB', text: '#1565C0' },
  COMPLETED: { bg: '#C8E6C9', text: '#2E7D32' },
  CANCELLED: { bg: '#FFCDD2', text: '#C62828' },
};

export const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает',
  ASSIGNED: 'Назначен',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен',
};
