import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import ordersRoutes from './routes/orders.js';

let redis: any = null;

try {
  const redisModule = await import('./config/redis.js');
  redis = redisModule.redis;
} catch (error) {
  console.warn('Redis не доступен, работаем без кэширования:', error);
}

const app = Fastify({ 
  logger: {
    level: env.NODE_ENV === 'development' ? 'info' : 'warn',
  },
  // Оптимизация для высокой нагрузки
  connectionTimeout: 60000,
  keepAliveTimeout: 72000,
  bodyLimit: 1048576, // 1MB
  requestIdHeader: false,
  requestIdLogLabel: false,
  disableRequestLogging: true, // Отключить логирование запросов для производительности
});

await app.register(cors, {
  origin: true,
});

await app.register(helmet, {
  contentSecurityPolicy: false, // Отключить для производительности
});

if (env.NODE_ENV !== 'test') {
  await app.register(rateLimit, {
    max: env.NODE_ENV === 'development' ? 100000 : 1000,
    timeWindow: '1 minute',
    // Увеличить лимиты для нагрузочного тестирования
    allowList: ['127.0.0.1', 'localhost'],
  });
}

app.get('/health', async () => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected',
    redis: redis ? 'connected' : 'disabled',
  };
});

app.register(ordersRoutes, { prefix: '/api' });

const start = async () => {
  try {
    await app.listen({ 
      port: env.PORT, 
      host: '0.0.0.0',
      // Оптимизация для высокой нагрузки
      backlog: 511, // Размер очереди подключений
    });
    console.log(`Server running on http://0.0.0.0:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

const shutdown = async () => {
  try {
    await app.close();
    if (redis) {
      await redis.quit();
    }
    console.log('Server closed gracefully');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Увеличить лимиты системы для Node.js
process.setMaxListeners(0);

start();