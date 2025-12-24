import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Начало заполнения базы данных...');

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
    const user = await prisma.user.create({
      data: {
        email: `testuser${i}@example.com`,
        name: `Test User ${i}`,
      },
    });
    testUsers.push(user);
  }

  for (let i = 0; i < 50; i++) {
    const product = await prisma.product.create({
      data: {
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