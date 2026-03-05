export const COLORS = {
  primary: '#1B5E20',
  primary2: '#2E7D32',
  accent: '#4CAF50',
  light: '#E8F5E9',
  background: '#F9F9F4',
  text: '#1C2A1C',
  gray: '#546E7A',
} as const;

export const DAYS_OF_WEEK = [
  'Дүйшөмбү', // Monday (Kyrgyz)
  'Шейшемби',
  'Шаршемби',
  'Бейшемби',
  'Жума',
  'Ишемби',
  'Жекшемби',
] as const;

export const DAYS_OF_WEEK_RU = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
] as const;

export const AREAS_NARYN = [
  'Центр',
  'Микрорайон',
  'Ак-Жол',
  'Кызыл-Жылдыз',
  'Нарын-1',
] as const;

export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
