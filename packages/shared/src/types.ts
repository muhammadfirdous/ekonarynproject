export enum Role {
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
  RESIDENT = 'RESIDENT',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  FAILED = 'failed',
}

export const ORDER_STATUSES = [
  'pending',
  'accepted',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
  'failed',
] as const;

export const ACCOUNT_STATUSES = ['ACTIVE', 'PENDING_APPROVAL', 'REJECTED', 'SUSPENDED'] as const;

export const ACTIVE_WORKER_STATUSES: AccountStatus[] = [AccountStatus.ACTIVE];

export enum ActivityAction {
  WORKER_REGISTERED = 'worker.registered',
  WORKER_APPROVED = 'worker.approved',
  WORKER_REJECTED = 'worker.rejected',
  WORKER_SUSPENDED = 'worker.suspended',
  WORKER_REACTIVATED = 'worker.reactivated',
  REQUEST_CREATED = 'request.created',
  REQUEST_CANCELLED = 'request.cancelled',
  ORDER_ASSIGNED = 'order.assigned',
  ORDER_REASSIGNED = 'order.reassigned',
  ORDER_STATUS_CHANGED = 'order.status_changed',
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGIN_BLOCKED = 'auth.login_blocked',
}

// Legacy alias retained for routes that still emit the older vocabulary.
// New code should use OrderStatus.
export enum RequestStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum FinancialType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: Role;
  address?: string;
  points: number;
  accountStatus: AccountStatus;
  statusReason?: string | null;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  idNumber?: string | null;
  idDocumentUrl?: string | null;
  serviceAreas?: string | null;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  vehicleCapacityKg?: number | null;
  maxConcurrentOrders?: number | null;
  onShift?: boolean;
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
  status: OrderStatus | string;
  notes?: string;
  createdAt: string;
  assignedWorkerId?: string | null;
  assignedAt?: string | null;
  cancellationReason?: string | null;
  resident?: User;
  material?: Material;
  assignedWorker?: User | null;
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

export interface ActivityLog {
  id: string;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
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
