import { readPrisma, writePrisma } from '../config/database.js';

export class OrderService {
  // Чтение с Replica (80% запросов)
  async getOrders(userId?: string) {
    return await readPrisma.order.findMany({
      where: userId ? { userId } : undefined,
      include: {
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
      take: 100,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrderById(id: string) {
    return await readPrisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        product: true,
      },
    });
  }

  // Запись на Master (20% запросов)
  async createOrder(data: {
    userId: string;
    productId: string;
    status?: string;
  }) {
    return await writePrisma.order.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        status: data.status || 'pending',
      },
      include: {
        user: true,
        product: true,
      },
    });
  }

  async updateOrderStatus(id: string, status: string) {
    return await writePrisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: true,
        product: true,
      },
    });
  }
}