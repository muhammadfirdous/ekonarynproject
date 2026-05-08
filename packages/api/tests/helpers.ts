import bcrypt from 'bcryptjs';
import { prisma } from '@ekonaryn/db';
import { AccountStatus, Role } from '@ekonaryn/shared';

export async function resetDb() {
  // Order matters because of foreign keys. Standalone tables (FinancialRecord,
  // Schedule) are wiped too so cross-file pollution can't leak into the next test.
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.route.deleteMany();
  await prisma.pickupRequest.deleteMany();
  await prisma.material.deleteMany();
  await prisma.user.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.schedule.deleteMany();
}

export async function createAdmin(
  overrides: Partial<{ phone: string; password: string; name: string }> = {},
) {
  return prisma.user.create({
    data: {
      name: overrides.name ?? 'Test Admin',
      phone: overrides.phone ?? '+996700000999',
      password: await bcrypt.hash(overrides.password ?? 'admin123', 10),
      role: Role.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      phoneVerifiedAt: new Date(),
    },
  });
}

export async function createResident(
  overrides: Partial<{ phone: string; password: string; name: string; address: string }> = {},
) {
  return prisma.user.create({
    data: {
      name: overrides.name ?? 'Test Resident',
      phone: overrides.phone ?? '+996700111000',
      password: await bcrypt.hash(overrides.password ?? 'resident123', 10),
      role: Role.RESIDENT,
      accountStatus: AccountStatus.ACTIVE,
      phoneVerifiedAt: new Date(),
      address: overrides.address ?? 'Center 1, Naryn',
    },
  });
}

export async function createWorker(
  overrides: Partial<{
    phone: string;
    password: string;
    name: string;
    status: AccountStatus;
    serviceAreas: string[];
    onShift: boolean;
    maxConcurrentOrders: number;
  }> = {},
) {
  return prisma.user.create({
    data: {
      name: overrides.name ?? 'Test Worker',
      phone: overrides.phone ?? '+996700222000',
      password: await bcrypt.hash(overrides.password ?? 'worker123', 10),
      role: Role.WORKER,
      accountStatus: overrides.status ?? AccountStatus.ACTIVE,
      phoneVerifiedAt: new Date(),
      idNumber: 'TEST-ID-001',
      serviceAreas: JSON.stringify(overrides.serviceAreas ?? ['Center']),
      vehicleType: 'pickup',
      vehiclePlate: '01KG000TST',
      vehicleCapacityKg: 500,
      maxConcurrentOrders: overrides.maxConcurrentOrders ?? 5,
      onShift: overrides.onShift ?? true,
    },
  });
}

export async function createMaterial() {
  return prisma.material.create({
    data: {
      name: 'PET',
      nameKy: 'ПЭТ',
      nameRu: 'ПЭТ',
      buyingPrice: 5,
      sellingPrice: 10,
    },
  });
}

export async function createPendingRequest(
  residentId: string,
  materialId: string,
  address = 'Center 5, Naryn',
) {
  return prisma.pickupRequest.create({
    data: {
      residentId,
      materialId,
      address,
      estimatedQty: 10,
      status: 'pending',
    },
  });
}
