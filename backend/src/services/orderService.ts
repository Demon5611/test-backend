import { readPrisma, writePrisma } from '../config/database.js';

/**
 * OrderService - сервис для работы с заказами
 * 
 * Использует разделение чтения/записи:
 * - readPrisma -> Replica (порт 5435) для чтения (80% запросов)
 * - writePrisma -> Master (порт 5434) для записи (20% запросов)
 */
export class OrderService {
  /**
   * Получить список заказов
   * Чтение выполняется на Replica для разгрузки Master
   * 
   * @param userId - опциональный фильтр по ID пользователя
   * @returns массив заказов с минимальными данными пользователя и продукта
   */
  async getOrders(userId?: string) {
    return await readPrisma.order.findMany({
      where: userId ? { userId } : undefined,
      // Используем select вместо include для уменьшения размера ответа
      // Это улучшает производительность и уменьшает нагрузку на сеть
      select: {
        id: true,
        userId: true,
        productId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // Минимальные данные пользователя (только необходимые поля)
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        // Минимальные данные продукта (только необходимые поля)
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      take: 50, // Ограничение количества записей для производительности
      orderBy: {
        createdAt: 'desc', // Сортировка по дате создания (новые сначала)
      },
    });
  }

  /**
   * Получить заказ по ID
   * Чтение выполняется на Replica
   * 
   * @param id - UUID заказа
   * @returns заказ с полными данными пользователя и продукта
   */
  async getOrderById(id: string) {
    return await readPrisma.order.findUnique({
      where: { id },
      // Для одного заказа используем include для получения всех данных
      include: {
        user: true,
        product: true,
      },
    });
  }

  /**
   * Создать новый заказ
   * Запись выполняется на Master, затем автоматически реплицируется на Replica
   * 
   * @param data - данные заказа (userId, productId, status)
   * @returns созданный заказ с данными пользователя и продукта
   */
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
      // Возвращаем полные данные для подтверждения создания
      include: {
        user: true,
        product: true,
      },
    });
  }

  /**
   * Обновить статус заказа
   * Запись выполняется на Master
   * 
   * @param id - UUID заказа
   * @param status - новый статус заказа
   * @returns обновленный заказ с данными пользователя и продукта
   */
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