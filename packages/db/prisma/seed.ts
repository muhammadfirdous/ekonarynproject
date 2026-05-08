import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hashSync(password, 10);
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.route.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.pickupRequest.deleteMany();
  await prisma.material.deleteMany();
  await prisma.user.deleteMany();

  // ==================== USERS ====================
  console.log('👤 Creating users...');

  const admin = await prisma.user.create({
    data: {
      name: 'Айбек Турсунов',
      phone: '+996700000001',
      password: await hashPassword('admin123'),
      role: 'ADMIN',
      address: 'ул. Ленина 45, Нарын',
      points: 0,
    },
  });

  const workers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Нурбек Асанов',
        phone: '+996700000002',
        password: await hashPassword('worker123'),
        role: 'WORKER',
        address: 'ул. Токтогула 12, Нарын',
        points: 0,
        accountStatus: 'ACTIVE',
        phoneVerifiedAt: new Date(),
        idNumber: 'AN1234567',
        serviceAreas: JSON.stringify(['Центр', 'Микрорайон']),
        vehicleType: 'pickup_truck',
        vehiclePlate: '01KG123ABC',
        vehicleCapacityKg: 800,
        maxConcurrentOrders: 5,
        onShift: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Талант Жумабеков',
        phone: '+996700000003',
        password: await hashPassword('worker123'),
        role: 'WORKER',
        address: 'ул. Манаса 78, Нарын',
        points: 0,
        accountStatus: 'ACTIVE',
        phoneVerifiedAt: new Date(),
        idNumber: 'AN1234568',
        serviceAreas: JSON.stringify(['Ак-Жол', 'Кызыл-Жылдыз']),
        vehicleType: 'van',
        vehiclePlate: '01KG456DEF',
        vehicleCapacityKg: 600,
        maxConcurrentOrders: 4,
        onShift: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Бакыт Кадыров',
        phone: '+996700000004',
        password: await hashPassword('worker123'),
        role: 'WORKER',
        address: 'Микрорайон 3, Нарын',
        points: 0,
        accountStatus: 'ACTIVE',
        phoneVerifiedAt: new Date(),
        idNumber: 'AN1234569',
        serviceAreas: JSON.stringify(['Нарын-1', 'Микрорайон']),
        vehicleType: 'pickup_truck',
        vehiclePlate: '01KG789GHI',
        vehicleCapacityKg: 750,
        maxConcurrentOrders: 5,
        onShift: false,
      },
    }),
    // Worker awaiting admin approval — exercises the new flow
    prisma.user.create({
      data: {
        name: 'Эмиль Дуйшеев',
        phone: '+996700000005',
        password: await hashPassword('worker123'),
        role: 'WORKER',
        address: 'ул. Ленина 90, Нарын',
        points: 0,
        accountStatus: 'PENDING_APPROVAL',
        phoneVerifiedAt: new Date(),
        idNumber: 'AN9999991',
        serviceAreas: JSON.stringify(['Центр']),
        vehicleType: 'motorcycle',
        vehiclePlate: '01KG010ZZZ',
        vehicleCapacityKg: 150,
        maxConcurrentOrders: 3,
        onShift: false,
      },
    }),
  ]);

  const residents = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Гүлнара Сатыбалдиева',
        phone: '+996700100001',
        password: await hashPassword('resident123'),
        role: 'RESIDENT',
        address: 'ул. Ленина 12, кв 5, Нарын',
        points: 150,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Асан Токторов',
        phone: '+996700100002',
        password: await hashPassword('resident123'),
        role: 'RESIDENT',
        address: 'ул. Токтогула 34, Нарын',
        points: 85,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Жылдыз Абдыраева',
        phone: '+996700100003',
        password: await hashPassword('resident123'),
        role: 'RESIDENT',
        address: 'Микрорайон 1, кв 23, Нарын',
        points: 200,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Мирлан Базарбаев',
        phone: '+996700100004',
        password: await hashPassword('resident123'),
        role: 'RESIDENT',
        address: 'ул. Манаса 56, Нарын',
        points: 45,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Айгуль Омурзакова',
        phone: '+996700100005',
        password: await hashPassword('resident123'),
        role: 'RESIDENT',
        address: 'Ак-Жол 15, Нарын',
        points: 120,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Кубат Эсенбеков',
        phone: '+996700100006',
        password: await hashPassword('resident123'),
        role: 'RESIDENT',
        address: 'Кызыл-Жылдыз 8, Нарын',
        points: 30,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Нуржан Алмазбекова',
        phone: '+996700100007',
        password: await hashPassword('resident123'),
        role: 'RESIDENT',
        address: 'ул. Ленина 89, кв 12, Нарын',
        points: 95,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Эрмек Тилеков',
        phone: '+996700100008',
        password: await hashPassword('resident123'),
        role: 'RESIDENT',
        address: 'Нарын-1, ул. Центральная 4, Нарын',
        points: 60,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Бурул Жапарова',
        phone: '+996700100009',
        password: await hashPassword('resident123'),
        role: 'RESIDENT',
        address: 'Микрорайон 2, кв 45, Нарын',
        points: 175,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Данияр Усубалиев',
        phone: '+996700100010',
        password: await hashPassword('resident123'),
        role: 'RESIDENT',
        address: 'ул. Токтогула 67, Нарын',
        points: 110,
      },
    }),
  ]);

  // ==================== MATERIALS ====================
  console.log('📦 Creating materials...');

  const materials = await Promise.all([
    prisma.material.create({
      data: {
        name: 'PET Plastic Bottles',
        nameKy: 'ПЭТ пластик бөтөлкөлөр',
        nameRu: 'ПЭТ пластиковые бутылки',
        buyingPrice: 5,
        sellingPrice: 10,
        unit: 'kg',
        description: 'Clean PET plastic bottles (water, soda, juice)',
      },
    }),
    prisma.material.create({
      data: {
        name: 'HDPE Plastic',
        nameKy: 'HDPE пластик',
        nameRu: 'HDPE пластик',
        buyingPrice: 4,
        sellingPrice: 8,
        unit: 'kg',
        description: 'HDPE containers (shampoo, detergent bottles)',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Cardboard',
        nameKy: 'Картон',
        nameRu: 'Картон',
        buyingPrice: 3,
        sellingPrice: 7,
        unit: 'kg',
        description: 'Clean cardboard boxes and packaging',
      },
    }),
    prisma.material.create({
      data: {
        name: 'Paper',
        nameKy: 'Кагаз',
        nameRu: 'Бумага',
        buyingPrice: 2,
        sellingPrice: 5,
        unit: 'kg',
        description: 'Newspapers, magazines, office paper',
      },
    }),
  ]);

  // ==================== PICKUP REQUESTS ====================
  console.log('📋 Creating pickup requests...');

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const requests = await Promise.all([
    // completed requests (10)
    ...Array.from({ length: 10 }, (_, i) =>
      prisma.pickupRequest.create({
        data: {
          residentId: residents[i % residents.length].id,
          materialId: materials[i % materials.length].id,
          address: residents[i % residents.length].address!,
          estimatedQty: Math.floor(Math.random() * 20) + 3,
          status: 'completed',
          notes: i % 3 === 0 ? 'Пожалуйста, позвоните перед приходом' : null,
          createdAt: daysAgo(Math.floor(Math.random() * 60) + 10),
        },
      }),
    ),
    // pending requests (5)
    ...Array.from({ length: 5 }, (_, i) =>
      prisma.pickupRequest.create({
        data: {
          residentId: residents[(i + 3) % residents.length].id,
          materialId: materials[i % materials.length].id,
          address: residents[(i + 3) % residents.length].address!,
          estimatedQty: Math.floor(Math.random() * 15) + 2,
          status: 'pending',
          notes: i === 0 ? 'У подъезда в черном мешке' : null,
          createdAt: daysAgo(Math.floor(Math.random() * 5)),
        },
      }),
    ),
    // assigned requests (3)
    ...Array.from({ length: 3 }, (_, i) =>
      prisma.pickupRequest.create({
        data: {
          residentId: residents[(i + 6) % residents.length].id,
          materialId: materials[i % materials.length].id,
          address: residents[(i + 6) % residents.length].address!,
          estimatedQty: Math.floor(Math.random() * 10) + 5,
          status: 'assigned',
          assignedWorkerId: workers[i % workers.length].id,
          assignedAt: daysAgo(Math.floor(Math.random() * 2)),
          createdAt: daysAgo(Math.floor(Math.random() * 3) + 1),
        },
      }),
    ),
    // cancelled requests (2)
    ...Array.from({ length: 2 }, (_, i) =>
      prisma.pickupRequest.create({
        data: {
          residentId: residents[(i + 8) % residents.length].id,
          materialId: materials[i % materials.length].id,
          address: residents[(i + 8) % residents.length].address!,
          estimatedQty: Math.floor(Math.random() * 8) + 1,
          status: 'cancelled',
          notes: 'Уже отдал другому сборщику',
          cancellationReason: 'Resident gave to another collector',
          createdAt: daysAgo(Math.floor(Math.random() * 30) + 5),
        },
      }),
    ),
  ]);

  const completedRequests = requests.filter((r) => r.status === 'completed');

  // ==================== TRIPS ====================
  console.log('🚛 Creating trips...');

  const trips = await Promise.all([
    prisma.trip.create({
      data: {
        workerId: workers[0].id,
        date: daysAgo(45),
        destination: 'Bishkek',
        totalWeightKg: 850,
        transportCost: 15000,
        revenue: 42500,
      },
    }),
    prisma.trip.create({
      data: {
        workerId: workers[0].id,
        date: daysAgo(20),
        destination: 'Bishkek',
        totalWeightKg: 920,
        transportCost: 15000,
        revenue: 46000,
      },
    }),
    prisma.trip.create({
      data: {
        workerId: workers[1].id,
        date: daysAgo(5),
        destination: 'Bishkek',
        totalWeightKg: 780,
        transportCost: 15000,
        revenue: 39000,
      },
    }),
  ]);

  // ==================== COLLECTIONS ====================
  console.log('♻️ Creating collections...');

  const collectionsData = completedRequests.slice(0, 15).map((req, i) => ({
    workerId: workers[i % workers.length].id,
    requestId: req.id,
    materialId: req.materialId,
    actualWeightKg: req.estimatedQty * (0.8 + Math.random() * 0.4), // ±20% of estimate
    notes: i % 4 === 0 ? 'Хорошее качество, чистый материал' : null,
    collectedAt: new Date(req.createdAt.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days after request
    tripId: i < 5 ? trips[0].id : i < 10 ? trips[1].id : trips[2].id,
  }));

  // Only create up to the number of completed requests available
  for (const data of collectionsData.slice(0, completedRequests.length)) {
    await prisma.collection.create({ data });
  }

  // ==================== ROUTES ====================
  console.log('🗺️ Creating routes...');

  await Promise.all([
    prisma.route.create({
      data: {
        workerId: workers[0].id,
        date: daysAgo(1),
        stops: JSON.stringify([
          { address: 'ул. Ленина 12, кв 5', order: 1, notes: 'PET bottles' },
          { address: 'ул. Токтогула 34', order: 2, notes: 'Cardboard' },
          { address: 'Микрорайон 1, кв 23', order: 3, notes: 'Mixed plastics' },
        ]),
        status: 'completed',
      },
    }),
    prisma.route.create({
      data: {
        workerId: workers[1].id,
        date: new Date(),
        stops: JSON.stringify([
          { address: 'Ак-Жол 15', order: 1, notes: 'Paper' },
          { address: 'Кызыл-Жылдыз 8', order: 2, notes: 'PET bottles' },
          { address: 'Нарын-1, ул. Центральная 4', order: 3, notes: 'HDPE' },
        ]),
        status: 'active',
      },
    }),
  ]);

  // ==================== FINANCIAL RECORDS ====================
  console.log('💰 Creating financial records...');

  const financialRecords = [
    // Month 1 (2 months ago)
    {
      type: 'INCOME',
      amount: 42500,
      description: 'Продажа пластика - Бишкек',
      category: 'sales',
      date: daysAgo(55),
    },
    {
      type: 'EXPENSE',
      amount: 15000,
      description: 'Транспорт Нарын-Бишкек',
      category: 'transport',
      date: daysAgo(55),
    },
    {
      type: 'EXPENSE',
      amount: 4250,
      description: 'Закупка у жителей - пластик',
      category: 'purchases',
      date: daysAgo(60),
    },
    {
      type: 'EXPENSE',
      amount: 25000,
      description: 'Зарплата - Нурбек',
      category: 'salary',
      date: daysAgo(60),
    },
    {
      type: 'EXPENSE',
      amount: 25000,
      description: 'Зарплата - Талант',
      category: 'salary',
      date: daysAgo(60),
    },
    { type: 'EXPENSE', amount: 3000, description: 'Бензин', category: 'fuel', date: daysAgo(58) },
    {
      type: 'EXPENSE',
      amount: 1500,
      description: 'Мешки для сбора',
      category: 'supplies',
      date: daysAgo(57),
    },

    // Month 2 (1 month ago)
    {
      type: 'INCOME',
      amount: 46000,
      description: 'Продажа пластика и картона - Бишкек',
      category: 'sales',
      date: daysAgo(25),
    },
    {
      type: 'EXPENSE',
      amount: 15000,
      description: 'Транспорт Нарын-Бишкек',
      category: 'transport',
      date: daysAgo(25),
    },
    {
      type: 'EXPENSE',
      amount: 4600,
      description: 'Закупка у жителей',
      category: 'purchases',
      date: daysAgo(30),
    },
    {
      type: 'EXPENSE',
      amount: 25000,
      description: 'Зарплата - Нурбек',
      category: 'salary',
      date: daysAgo(30),
    },
    {
      type: 'EXPENSE',
      amount: 25000,
      description: 'Зарплата - Талант',
      category: 'salary',
      date: daysAgo(30),
    },
    { type: 'EXPENSE', amount: 3500, description: 'Бензин', category: 'fuel', date: daysAgo(28) },
    {
      type: 'INCOME',
      amount: 5000,
      description: 'Грант от экологической организации',
      category: 'grant',
      date: daysAgo(22),
    },

    // Month 3 (current)
    {
      type: 'INCOME',
      amount: 39000,
      description: 'Продажа смешанных материалов - Бишкек',
      category: 'sales',
      date: daysAgo(5),
    },
    {
      type: 'EXPENSE',
      amount: 15000,
      description: 'Транспорт Нарын-Бишкек',
      category: 'transport',
      date: daysAgo(5),
    },
    {
      type: 'EXPENSE',
      amount: 3900,
      description: 'Закупка у жителей',
      category: 'purchases',
      date: daysAgo(8),
    },
    { type: 'EXPENSE', amount: 2800, description: 'Бензин', category: 'fuel', date: daysAgo(6) },
    {
      type: 'EXPENSE',
      amount: 2000,
      description: 'Ремонт прицепа',
      category: 'maintenance',
      date: daysAgo(3),
    },
  ];

  await Promise.all(
    financialRecords.map((record) => prisma.financialRecord.create({ data: record })),
  );

  // ==================== SCHEDULES ====================
  console.log('📅 Creating collection schedules...');

  const schedules = [
    { area: 'Центр', dayOfWeek: 1, time: '09:00', active: true },
    { area: 'Центр', dayOfWeek: 4, time: '09:00', active: true },
    { area: 'Микрорайон', dayOfWeek: 2, time: '10:00', active: true },
    { area: 'Микрорайон', dayOfWeek: 5, time: '10:00', active: true },
    { area: 'Ак-Жол', dayOfWeek: 3, time: '09:30', active: true },
    { area: 'Кызыл-Жылдыз', dayOfWeek: 3, time: '14:00', active: true },
    { area: 'Нарын-1', dayOfWeek: 1, time: '14:00', active: true },
    { area: 'Нарын-1', dayOfWeek: 4, time: '14:00', active: true },
  ];

  await Promise.all(schedules.map((s) => prisma.schedule.create({ data: s })));

  // ==================== NOTIFICATIONS ====================
  console.log('🔔 Creating notifications...');

  await Promise.all([
    prisma.notification.create({
      data: {
        userId: residents[0].id,
        title: 'Сбор завершен!',
        body: 'Ваш пластик был успешно собран. +15 баллов!',
        read: true,
        createdAt: daysAgo(10),
      },
    }),
    prisma.notification.create({
      data: {
        userId: residents[2].id,
        title: 'Напоминание о сборе',
        body: 'Завтра сбор в вашем районе (Микрорайон). Подготовьте материалы!',
        read: false,
        createdAt: daysAgo(1),
      },
    }),
    prisma.notification.create({
      data: {
        userId: residents[4].id,
        title: 'Заявка принята',
        body: 'Ваша заявка на сбор картона принята. Работник приедет в течение 2 дней.',
        read: false,
        createdAt: daysAgo(0),
      },
    }),
  ]);

  console.log('');
  console.log('✅ Seeding complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Users: 1 admin, ${workers.length} workers, ${residents.length} residents`);
  console.log(`   Materials: ${materials.length}`);
  console.log(`   Pickup Requests: ${requests.length}`);
  console.log(`   Collections: ${Math.min(collectionsData.length, completedRequests.length)}`);
  console.log(`   Trips: ${trips.length}`);
  console.log(`   Financial Records: ${financialRecords.length}`);
  console.log(`   Schedules: ${schedules.length}`);
  console.log('');
  console.log('🔑 Login credentials:');
  console.log('   Admin:    +996700000001 / admin123');
  console.log('   Worker:   +996700000002 / worker123');
  console.log('   Resident: +996700100001 / resident123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
