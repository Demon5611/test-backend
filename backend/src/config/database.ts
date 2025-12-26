import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Пул для записи (Master)
const writePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Пул для чтения (Replica)
const readPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_REPLICA_URL || process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Graceful shutdown
const shutdown = async () => {
  await writePrisma.$disconnect();
  await readPrisma.$disconnect();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { writePrisma, readPrisma };
export default { writePrisma, readPrisma };