import { readPrisma, writePrisma } from '../config/database.js';
import { redis } from '../config/redis.js';

const CACHE_TTL = 30;

export class OrderService {
  async getOrders(userId?: string) {
    const cacheKey = userId ? `orders:user:${userId}` : 'orders:all';
    
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.error('Redis cache read error:', error);
      }
    }
    
    const orders = await readPrisma.order.findMany({
      where: userId ? { userId } : undefined,
      select: {
        id: true,
        userId: true,
        productId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      take: 50,
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(orders));
      } catch (error) {
        console.error('Redis cache write error:', error);
      }
    }
    
    return orders;
  }

  async getOrderById(id: string) {
    const cacheKey = `order:${id}`;
    
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.error('Redis cache read error:', error);
      }
    }
    
    const order = await readPrisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        product: true,
      },
    });
    
    if (order && redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(order));
      } catch (error) {
        console.error('Redis cache write error:', error);
      }
    }
    
    return order;
  }

  async createOrder(data: {
    userId: string;
    productId: string;
    status?: string;
  }) {
    const order = await writePrisma.order.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        status: data.status || 'pending',
      },
      select: {
        id: true,
        userId: true,
        productId: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });
    
    if (redis) {
      try {
        await redis.del('orders:all');
        await redis.del(`orders:user:${data.userId}`);
      } catch (error) {
        console.error('Redis cache invalidation error:', error);
      }
    }
    
    return order;
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await writePrisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        product: true,
      },
    });
    
    if (redis) {
      try {
        await redis.del(`order:${id}`);
        await redis.del('orders:all');
        if (order.userId) {
          await redis.del(`orders:user:${order.userId}`);
        }
      } catch (error) {
        console.error('Redis cache invalidation error:', error);
      }
    }
    
    return order;
  }
}