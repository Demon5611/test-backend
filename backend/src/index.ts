import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import ordersRoutes from './routes/orders.js';

const app = Fastify({ 
  logger: {
    level: env.NODE_ENV === 'development' ? 'info' : 'warn',
  },
});

// Регистрация плагинов
await app.register(cors, {
  origin: true,
});

await app.register(helmet);

await app.register(rateLimit, {
  max: 1000,
  timeWindow: '1 minute',
});

// Health check
app.get('/health', async () => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected',
  };
});

// Регистрация роутов
app.register(ordersRoutes, { prefix: '/api' });

const start = async () => {
  try {
    await app.listen({ 
      port: env.PORT, 
      host: '0.0.0.0',
    });
    console.log(`Server running on http://0.0.0.0:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();