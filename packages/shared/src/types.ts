export enum Role {
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
  RESIDENT = 'RESIDENT',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum FinancialType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  address?: string;
  points: number;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  nameKy: string;
  nameRu: string;
  buyingPrice: number;
  sellingPrice: number;
  unit: string;
  description?: string;
  imageUrl?: string;
}

export interface PickupRequest {
  id: string;
  residentId: string;
  materialId: string;
  address: string;
  estimatedQty: number;
  status: RequestStatus;
  notes?: string;
  createdAt: string;
  resident?: User;
  material?: Material;
}

export interface Collection {
  id: string;
  workerId: string;
  requestId: string;
  materialId: string;
  actualWeightKg: number;
  photoUrl?: string;
  notes?: string;
  collectedAt: string;
  tripId?: string;
  worker?: User;
  request?: PickupRequest;
  material?: Material;
}

export interface Trip {
  id: string;
  workerId: string;
  date: string;
  destination: string;
  totalWeightKg: number;
  transportCost: number;
  revenue: number;
  collections?: Collection[];
  createdAt: string;
}

export interface Route {
  id: string;
  workerId: string;
  date: string;
  stops: unknown;
  status: string;
  createdAt: string;
}

export interface FinancialRecord {
  id: string;
  type: FinancialType;
  amount: number;
  description: string;
  category?: string;
  date: string;
  createdAt: string;
}

export interface Schedule {
  id: string;
  area: string;
  dayOfWeek: number;
  time: string;
  active: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
