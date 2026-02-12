import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Начало заполнения базы данных...');

  // Пользователи и товары с фиксированными ID для k6 (orders_test.js)
  const K6_USER_IDS = [
    'f1afca3f-0ff7-4067-a311-0db7bbb8b4d3',
    '0a5efa57-0183-4b83-9b75-23adbc7b1331',
    '621dcbbd-525c-4559-91d6-8bc243b34466',
    'bc342bc7-e3bb-490f-ac30-2ffe73d38c5e',
    '4f6a8ee8-5284-4dce-b6ea-1da458ad1c71',
    '3f36f3e6-2e39-4651-b5b2-b46ed5902dab',
    '69a1915e-801f-4cbb-9819-8142923d2059',
    '5f147405-da63-4272-8f58-12568619a822',
    '819c1f9c-f1ff-481f-991c-1071c3ceaeac',
    '70f8f774-c1c2-4b13-bc57-30b696e1516f',
  ];
  const K6_PRODUCT_IDS = [
    'c6b4d43b-8207-42b2-ae1c-e16e5e16300c',
    '7f3072dc-4ff1-47d1-8fbb-2c8d644d3129',
    'dc6c6f35-abfb-4a48-86a5-ef7ceb6e2c04',
    '78b0a18d-46d6-41d1-b920-d87f53acd97c',
    '5e3bcea1-074f-4dc8-a4fc-f80185c5d185',
    'd709d741-0723-463d-b386-06a2338c0f5d',
    '17b22d51-e0dc-4773-a5c2-ad27a8da727e',
    '3c1cc4e4-271d-4562-99b2-e18a09e12b91',
  ];
  for (let i = 0; i < K6_USER_IDS.length; i++) {
    await prisma.user.upsert({
      where: { id: K6_USER_IDS[i] },
      update: {},
      create: {
        id: K6_USER_IDS[i],
        email: `k6user${i}@loadtest.example.com`,
        name: `K6 Load User ${i}`,
      },
    });
  }
  for (let i = 0; i < K6_PRODUCT_IDS.length; i++) {
    await prisma.product.upsert({
      where: { id: K6_PRODUCT_IDS[i] },
      update: {},
      create: {
        id: K6_PRODUCT_IDS[i],
        name: `K6 Product ${i}`,
        description: `Load test product ${i}`,
        price: 100 + i,
        stock: 1000,
      },
    });
  }
  console.log('K6 load-test users and products (fixed IDs) created.');

  // Создание пользователей
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      name: 'Иван Иванов',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      email: 'user2@example.com',
      name: 'Мария Петрова',
    },
  });

  console.log('Пользователи созданы:', { user1, user2 });

  // Создание продуктов
  const product1 = await prisma.product.upsert({
    where: { id: 'product-1' },
    update: {},
    create: {
      id: 'product-1',
      name: 'Ноутбук',
      description: 'Мощный ноутбук для работы',
      price: 89999.99,
      stock: 10,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { id: 'product-2' },
    update: {},
    create: {
      id: 'product-2',
      name: 'Смартфон',
      description: 'Современный смартфон',
      price: 49999.99,
      stock: 25,
    },
  });

  console.log('Продукты созданы:', { product1, product2 });

  // Создание заказов
  const order1 = await prisma.order.create({
    data: {
      userId: user1.id,
      productId: product1.id,
      status: 'pending',
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: user2.id,
      productId: product2.id,
      status: 'completed',
    },
  });

  console.log('Заказы созданы:', { order1, order2 });

  // Создание 10k тестовых записей для нагрузочного тестирования
  console.log('Создание 10k тестовых заказов...');
  const testUsers = [];
  const testProducts = [];

  for (let i = 0; i < 100; i++) {
    const user = await prisma.user.upsert({
      where: { email: `testuser${i}@example.com` },
      update: {},
      create: {
        email: `testuser${i}@example.com`,
        name: `Test User ${i}`,
      },
    });
    testUsers.push(user);
  }
  for (let i = 0; i < 50; i++) {
    const product = await prisma.product.upsert({
      where: { id: `test-product-${i}` },
      update: {},
      create: {
        id: `test-product-${i}`,
        name: `Product ${i}`,
        description: `Test product ${i}`,
        price: Math.random() * 100000,
        stock: Math.floor(Math.random() * 100),
      },
    });
    testProducts.push(product);
  }
  const orders = [];
  for (let i = 0; i < 10000; i++) {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)];
    const product = testProducts[Math.floor(Math.random() * testProducts.length)];
    const statuses = ['pending', 'processing', 'completed', 'cancelled'];

    orders.push({
      userId: user.id,
      productId: product.id,
      status: statuses[Math.floor(Math.random() * statuses.length)],
    });
  }

  await prisma.order.createMany({
    data: orders,
  });

  console.log('10k тестовых заказов созданы!');
  console.log('Заполнение базы данных завершено.');
}

main()
  .catch((e) => {
    console.error('Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });