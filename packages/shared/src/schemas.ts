import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+996\d{9}$/, 'Phone must be in format +996XXXXXXXXX'),
  password: z.string().min(6).max(100),
  address: z.string().optional(),
});

export const loginSchema = z.object({
  phone: z.string().regex(/^\+996\d{9}$/),
  password: z.string().min(1),
});

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
  status: z.enum(['PENDING', 'ASSIGNED', 'COMPLETED', 'CANCELLED']),
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
  phone: z.string().regex(/^\+996\d{9}$/).optional(),
  address: z.string().optional(),
  role: z.enum(['ADMIN', 'WORKER', 'RESIDENT']).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MaterialInput = z.infer<typeof materialSchema>;
export type PickupRequestInput = z.infer<typeof pickupRequestSchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;
export type TripInput = z.infer<typeof tripSchema>;
export type RouteInput = z.infer<typeof routeSchema>;
export type FinancialRecordInput = z.infer<typeof financialRecordSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
