import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const getDatabaseUrlWithPool = (baseUrl: string) => {
  try {
    const url = new URL(baseUrl);
    // Увеличить лимиты для высокой нагрузки
    url.searchParams.set('connection_limit', '50');
    url.searchParams.set('pool_timeout', '20');
    url.searchParams.set('connect_timeout', '20');
    return url.toString();
  } catch (error) {
    console.error('Error parsing database URL:', error);
    return baseUrl;
  }
};

const writePrisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrlWithPool(process.env.DATABASE_URL || ''),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
});

const readPrisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrlWithPool(
        process.env.DATABASE_REPLICA_URL || process.env.DATABASE_URL || ''
      ),
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
});

const shutdown = async () => {
  await writePrisma.$disconnect();
  await readPrisma.$disconnect();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { writePrisma, readPrisma };
export default { writePrisma, readPrisma };