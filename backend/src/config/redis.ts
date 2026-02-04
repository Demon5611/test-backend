import Redis from 'ioredis';

let redis: Redis | null = null;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    enableReadyCheck: true,
    enableOfflineQueue: false,
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });

  redis.on('connect', () => {
    console.log('Redis connected');
  });

  redis.connect().catch((err) => {
    console.warn('Redis connection failed, continuing without cache:', err.message);
  });
} catch (error) {
  console.warn('Redis initialization failed:', error);
}

export { redis };