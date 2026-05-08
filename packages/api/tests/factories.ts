import bcrypt from 'bcryptjs';
import { prisma } from '@ekonaryn/db';
import { AccountStatus, OrderStatus, Role } from '@ekonaryn/shared';

// ----------------------------------------------------------------------------
// Factories: tiny builders that create rows with sensible defaults so individual
// test bodies stay short. Every factory takes an `overrides` object that wins
// over the defaults; callers can also pass in foreign-key IDs explicitly.
//
// Conventions:
//  - Phone numbers are auto-generated unique strings in the +996700XXXXXX range.
//  - Passwords default to a known plaintext so the matching loginAs() helper
//    can sign in without each test repeating the value.
//  - Date fields default to now() unless the test cares about time.
// ----------------------------------------------------------------------------

const DEFAULT_PASSWORD = 'pass1234';
let phoneCounter = 0;
function nextPhone(prefix = '+996700'): string {
  phoneCounter += 1;
  // Ensure 9 digits after +996 by zero-padding the counter.
  return `${prefix}${String(phoneCounter).padStart(6, '0')}`;
}

async function hash(pw: string) {
  return bcrypt.hash(pw, 4); // intentionally low cost in tests
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface UserOverrides {
  id?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  password?: string;
  role?: Role;
  address?: string;
  points?: number;
  accountStatus?: AccountStatus;
  statusReason?: string | null;
  phoneVerifiedAt?: Date | null;
  emailVerifiedAt?: Date | null;
  verificationCode?: string | null;
  verificationCodeExpiresAt?: Date | null;
  idNumber?: string | null;
  idDocumentUrl?: string | null;
  serviceAreas?: string[];
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  vehicleCapacityKg?: number | null;
  maxConcurrentOrders?: number;
  onShift?: boolean;
  deletedAt?: Date | null;
}

export interface CreatedUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  accountStatus: string;
  /** Plaintext password — only valid in tests. Use this with loginAs(). */
  plaintextPassword: string;
}

async function createUser(overrides: UserOverrides = {}): Promise<CreatedUser> {
  const password = overrides.password ?? DEFAULT_PASSWORD;
  const phone = overrides.phone ?? nextPhone();
  const role = overrides.role ?? Role.RESIDENT;
  const data: Record<string, unknown> = {
    name: overrides.name ?? `Test ${role}`,
    phone,
    email: overrides.email ?? null,
    password: await hash(password),
    role,
    address: overrides.address ?? 'Center 1, Naryn',
    points: overrides.points ?? 0,
    accountStatus: overrides.accountStatus ?? AccountStatus.ACTIVE,
    statusReason: overrides.statusReason ?? null,
    phoneVerifiedAt: overrides.phoneVerifiedAt ?? new Date(),
    emailVerifiedAt: overrides.emailVerifiedAt ?? null,
    verificationCode: overrides.verificationCode ?? null,
    verificationCodeExpiresAt: overrides.verificationCodeExpiresAt ?? null,
    idNumber: overrides.idNumber ?? null,
    idDocumentUrl: overrides.idDocumentUrl ?? null,
    serviceAreas:
      overrides.serviceAreas !== undefined ? JSON.stringify(overrides.serviceAreas) : null,
    vehicleType: overrides.vehicleType ?? null,
    vehiclePlate: overrides.vehiclePlate ?? null,
    vehicleCapacityKg: overrides.vehicleCapacityKg ?? null,
    maxConcurrentOrders: overrides.maxConcurrentOrders ?? 5,
    onShift: overrides.onShift ?? false,
    deletedAt: overrides.deletedAt ?? null,
  };
  if (overrides.id) data.id = overrides.id;
  const u = await prisma.user.create({ data: data as never });
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    accountStatus: u.accountStatus,
    plaintextPassword: password,
  };
}

export const factories = {
  user: createUser,

  admin(overrides: UserOverrides = {}) {
    return createUser({
      role: Role.ADMIN,
      name: overrides.name ?? 'Test Admin',
      ...overrides,
      // Force role to ADMIN even if caller passed something else.
      ...{ role: Role.ADMIN },
    });
  },

  resident(overrides: UserOverrides = {}) {
    return createUser({
      role: Role.RESIDENT,
      name: overrides.name ?? 'Test Resident',
      address: overrides.address ?? 'Center 5, Naryn',
      ...overrides,
      ...{ role: Role.RESIDENT },
    });
  },

  /** Active, on-shift, with a service area covering "Center". */
  worker(overrides: UserOverrides = {}) {
    return createUser({
      role: Role.WORKER,
      name: overrides.name ?? 'Test Worker',
      accountStatus: AccountStatus.ACTIVE,
      onShift: true,
      idNumber: 'AN0000001',
      serviceAreas: ['Center', 'Mikrorayon'],
      vehicleType: 'pickup',
      vehiclePlate: '01KGTEST01',
      vehicleCapacityKg: 600,
      maxConcurrentOrders: 5,
      ...overrides,
      ...{ role: Role.WORKER },
    });
  },

  pendingWorker(overrides: UserOverrides = {}) {
    return createUser({
      role: Role.WORKER,
      name: overrides.name ?? 'Pending Worker',
      accountStatus: AccountStatus.PENDING_APPROVAL,
      onShift: false,
      idNumber: 'AN9999999',
      serviceAreas: ['Center'],
      vehicleType: 'pickup',
      vehiclePlate: '01KGPEND01',
      vehicleCapacityKg: 400,
      ...overrides,
      ...{ role: Role.WORKER, accountStatus: AccountStatus.PENDING_APPROVAL },
    });
  },

  rejectedWorker(overrides: UserOverrides = {}) {
    return createUser({
      role: Role.WORKER,
      accountStatus: AccountStatus.REJECTED,
      statusReason: overrides.statusReason ?? 'Documents unclear',
      ...overrides,
      ...{ role: Role.WORKER, accountStatus: AccountStatus.REJECTED },
    });
  },

  suspendedWorker(overrides: UserOverrides = {}) {
    return createUser({
      role: Role.WORKER,
      accountStatus: AccountStatus.SUSPENDED,
      statusReason: overrides.statusReason ?? 'Suspended for review',
      ...overrides,
      ...{ role: Role.WORKER, accountStatus: AccountStatus.SUSPENDED },
    });
  },

  // -------------------------------------------------------------------------
  // Material
  // -------------------------------------------------------------------------
  async material(
    overrides: Partial<{
      name: string;
      nameKy: string;
      nameRu: string;
      buyingPrice: number;
      sellingPrice: number;
      unit: string;
    }> = {},
  ) {
    return prisma.material.create({
      data: {
        name: overrides.name ?? 'PET',
        nameKy: overrides.nameKy ?? 'ПЭТ',
        nameRu: overrides.nameRu ?? 'ПЭТ',
        buyingPrice: overrides.buyingPrice ?? 5,
        sellingPrice: overrides.sellingPrice ?? 10,
        unit: overrides.unit ?? 'kg',
      },
    });
  },

  // -------------------------------------------------------------------------
  // PickupRequest at any lifecycle state
  // -------------------------------------------------------------------------
  async pickupRequest(opts: {
    residentId: string;
    materialId: string;
    address?: string;
    estimatedQty?: number;
    status?: OrderStatus;
    assignedWorkerId?: string | null;
    cancellationReason?: string | null;
    deletedAt?: Date | null;
    notes?: string;
  }) {
    return prisma.pickupRequest.create({
      data: {
        residentId: opts.residentId,
        materialId: opts.materialId,
        address: opts.address ?? 'Center 5, Naryn',
        estimatedQty: opts.estimatedQty ?? 10,
        status: opts.status ?? OrderStatus.PENDING,
        assignedWorkerId: opts.assignedWorkerId ?? null,
        assignedAt: opts.assignedWorkerId ? new Date() : null,
        cancellationReason: opts.cancellationReason ?? null,
        deletedAt: opts.deletedAt ?? null,
        notes: opts.notes ?? null,
      },
    });
  },

  // -------------------------------------------------------------------------
  // Collection
  // -------------------------------------------------------------------------
  async collection(opts: {
    workerId: string;
    requestId: string;
    materialId: string;
    actualWeightKg?: number;
    photoUrl?: string | null;
    tripId?: string | null;
  }) {
    return prisma.collection.create({
      data: {
        workerId: opts.workerId,
        requestId: opts.requestId,
        materialId: opts.materialId,
        actualWeightKg: opts.actualWeightKg ?? 7.5,
        photoUrl: opts.photoUrl ?? null,
        tripId: opts.tripId ?? null,
      },
    });
  },

  // -------------------------------------------------------------------------
  // Trip
  // -------------------------------------------------------------------------
  async trip(opts: {
    workerId: string;
    date?: Date;
    destination?: string;
    totalWeightKg?: number;
    transportCost?: number;
    revenue?: number;
  }) {
    return prisma.trip.create({
      data: {
        workerId: opts.workerId,
        date: opts.date ?? new Date(),
        destination: opts.destination ?? 'Bishkek',
        totalWeightKg: opts.totalWeightKg ?? 0,
        transportCost: opts.transportCost ?? 0,
        revenue: opts.revenue ?? 0,
      },
    });
  },

  // -------------------------------------------------------------------------
  // Route
  // -------------------------------------------------------------------------
  async route(opts: {
    workerId: string;
    date?: Date;
    stops?: Array<{ address: string; order: number; notes?: string }>;
    status?: string;
  }) {
    return prisma.route.create({
      data: {
        workerId: opts.workerId,
        date: opts.date ?? new Date(),
        stops: JSON.stringify(opts.stops ?? [{ address: 'Center 1', order: 1 }]),
        status: opts.status ?? 'active',
      },
    });
  },

  // -------------------------------------------------------------------------
  // FinancialRecord
  // -------------------------------------------------------------------------
  async financialRecord(
    opts: {
      type?: 'INCOME' | 'EXPENSE';
      amount?: number;
      description?: string;
      category?: string | null;
      date?: Date;
    } = {},
  ) {
    return prisma.financialRecord.create({
      data: {
        type: opts.type ?? 'INCOME',
        amount: opts.amount ?? 1000,
        description: opts.description ?? 'Test entry',
        category: opts.category ?? null,
        date: opts.date ?? new Date(),
      },
    });
  },

  // -------------------------------------------------------------------------
  // Schedule
  // -------------------------------------------------------------------------
  async schedule(
    overrides: Partial<{ area: string; dayOfWeek: number; time: string; active: boolean }> = {},
  ) {
    return prisma.schedule.create({
      data: {
        area: overrides.area ?? 'Center',
        dayOfWeek: overrides.dayOfWeek ?? 1,
        time: overrides.time ?? '09:00',
        active: overrides.active ?? true,
      },
    });
  },

  // -------------------------------------------------------------------------
  // ActivityLog (handy for negative tests)
  // -------------------------------------------------------------------------
  async activityLog(opts: {
    actorId?: string | null;
    actorRole?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return prisma.activityLog.create({
      data: {
        actorId: opts.actorId ?? null,
        actorRole: opts.actorRole ?? null,
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId ?? null,
        metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
      },
    });
  },
};

// Test-only utility — counts all rows in the activity log for a given action,
// useful for "did this side effect actually fire?" assertions.
export async function countActivity(action: string, entityId?: string): Promise<number> {
  return prisma.activityLog.count({
    where: { action, ...(entityId ? { entityId } : {}) },
  });
}
