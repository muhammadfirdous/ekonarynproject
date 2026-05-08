import { z } from 'zod';
import { ORDER_STATUSES, ACCOUNT_STATUSES } from './types';

const phoneSchema = z.string().regex(/^\+996\d{9}$/, 'Phone must be in format +996XXXXXXXXX');

// ============================================================================
// Auth & registration
// ============================================================================

// Legacy registration (resident-only, kept for backwards compat with old clients)
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  phone: phoneSchema,
  password: z.string().min(6).max(100),
  address: z.string().optional(),
});

export const residentRegisterSchema = z.object({
  name: z.string().min(2).max(100),
  phone: phoneSchema,
  email: z.string().email().optional(),
  password: z.string().min(6).max(100),
  address: z.string().optional(),
});

export const workerRegisterSchema = z.object({
  name: z.string().min(2).max(100),
  phone: phoneSchema,
  email: z.string().email().optional(),
  password: z.string().min(6).max(100),
  idNumber: z.string().min(3).max(50),
  serviceAreas: z.array(z.string().min(1)).min(1, 'At least one service area is required'),
  vehicleType: z.string().min(1),
  vehiclePlate: z.string().min(1).max(20),
  vehicleCapacityKg: z.number().positive(),
  // idDocumentUrl is set server-side from the multer upload, so it is omitted here.
});

export const verifyCodeSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export const resendCodeSchema = z.object({
  phone: phoneSchema,
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1),
});

// ============================================================================
// Materials, requests, collections, trips, routes, financial, schedule
// ============================================================================

export const materialSchema = z.object({
  name: z.string().min(1),
  nameKy: z.string().min(1),
  nameRu: z.string().min(1),
  buyingPrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  unit: z.string().default('kg'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const pickupRequestSchema = z.object({
  materialId: z.string().uuid(),
  address: z.string().min(1),
  estimatedQty: z.number().positive(),
  notes: z.string().optional(),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  reason: z.string().optional(),
});

export const assignOrderSchema = z.object({
  workerId: z.string().uuid(),
});

export const collectionSchema = z.object({
  requestId: z.string().uuid(),
  materialId: z.string().uuid(),
  actualWeightKg: z.number().positive(),
  notes: z.string().optional(),
});

export const tripSchema = z.object({
  date: z.string().datetime(),
  destination: z.string().default('Bishkek'),
  totalWeightKg: z.number().min(0).optional(),
  transportCost: z.number().min(0).optional(),
  revenue: z.number().min(0).optional(),
  collectionIds: z.array(z.string().uuid()).optional(),
});

export const routeSchema = z.object({
  workerId: z.string().uuid(),
  date: z.string().datetime(),
  stops: z.array(
    z.object({
      address: z.string(),
      requestId: z.string().uuid().optional(),
      order: z.number(),
      notes: z.string().optional(),
    }),
  ),
});

export const financialRecordSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive(),
  description: z.string().min(1),
  category: z.string().optional(),
  date: z.string().datetime(),
});

export const scheduleSchema = z.object({
  area: z.string().min(1),
  dayOfWeek: z.number().int().min(0).max(6),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  active: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: phoneSchema.optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  role: z.enum(['ADMIN', 'WORKER', 'RESIDENT']).optional(),
  accountStatus: z.enum(ACCOUNT_STATUSES).optional(),
  onShift: z.boolean().optional(),
  serviceAreas: z.array(z.string()).optional(),
  vehicleType: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleCapacityKg: z.number().positive().optional(),
  maxConcurrentOrders: z.number().int().positive().optional(),
});

// ============================================================================
// Worker approval workflow
// ============================================================================

export const rejectWorkerSchema = z.object({
  reason: z.string().min(3, 'A rejection reason is required'),
});

export const suspendWorkerSchema = z.object({
  reason: z.string().min(3, 'A suspension reason is required'),
});

export const reactivateWorkerSchema = z.object({
  reason: z.string().optional(),
});

// ============================================================================
// Type exports
// ============================================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type ResidentRegisterInput = z.infer<typeof residentRegisterSchema>;
export type WorkerRegisterInput = z.infer<typeof workerRegisterSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MaterialInput = z.infer<typeof materialSchema>;
export type PickupRequestInput = z.infer<typeof pickupRequestSchema>;
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;
export type AssignOrderInput = z.infer<typeof assignOrderSchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;
export type TripInput = z.infer<typeof tripSchema>;
export type RouteInput = z.infer<typeof routeSchema>;
export type FinancialRecordInput = z.infer<typeof financialRecordSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type RejectWorkerInput = z.infer<typeof rejectWorkerSchema>;
export type SuspendWorkerInput = z.infer<typeof suspendWorkerSchema>;
