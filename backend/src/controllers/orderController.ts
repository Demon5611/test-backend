import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/orderService.js';

const orderService = new OrderService();

/**
 * Валидация UUID формата
 */
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * GET /api/orders
 * Получить список заказов (чтение с Replica)
 */
export async function getOrders(
  request: FastifyRequest<{ Querystring: { userId?: string } }>,
  reply: FastifyReply
) {
  try {
    const { userId } = request.query;
    
    // Валидация userId если передан
    if (userId && !isValidUUID(userId)) {
      return reply.status(400).send({ 
        error: 'Invalid userId format. Expected UUID format.' 
      });
    }
    
    const orders = await orderService.getOrders(userId);
    
    return reply.send({ 
      orders, 
      count: orders.length 
    });
  } catch (error) {
    request.log.error({ error }, 'Failed to fetch orders');
    
    // Более информативная обработка ошибок
    if (error instanceof Error) {
      return reply.status(500).send({ 
        error: 'Failed to fetch orders',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    return reply.status(500).send({ error: 'Failed to fetch orders' });
  }
}

/**
 * GET /api/orders/:id
 * Получить заказ по ID (чтение с Replica)
 */
export async function getOrderById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    
    // Валидация UUID
    if (!isValidUUID(id)) {
      return reply.status(400).send({ 
        error: 'Invalid order ID format. Expected UUID format.' 
      });
    }
    
    const order = await orderService.getOrderById(id);
    
    if (!order) {
      return reply.status(404).send({ 
        error: 'Order not found',
        orderId: id
      });
    }
    
    return reply.send(order);
  } catch (error) {
    request.log.error({ error, orderId: request.params.id }, 'Failed to fetch order');
    
    if (error instanceof Error) {
      return reply.status(500).send({ 
        error: 'Failed to fetch order',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    return reply.status(500).send({ error: 'Failed to fetch order' });
  }
}

/**
 * POST /api/orders
 * Создать новый заказ (запись на Master)
 */
export async function createOrder(
  request: FastifyRequest<{
    Body: {
      userId: string;
      productId: string;
      status?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { userId, productId, status } = request.body;
    
    // Валидация обязательных полей
    if (!userId || !productId) {
      return reply.status(400).send({ 
        error: 'userId and productId are required',
        received: { userId: !!userId, productId: !!productId }
      });
    }
    
    // Валидация формата UUID
    if (!isValidUUID(userId)) {
      return reply.status(400).send({ 
        error: 'Invalid userId format. Expected UUID format.',
        received: userId
      });
    }
    
    if (!isValidUUID(productId)) {
      return reply.status(400).send({ 
        error: 'Invalid productId format. Expected UUID format.',
        received: productId
      });
    }
    
    // Валидация статуса если передан
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return reply.status(400).send({ 
        error: 'Invalid status',
        received: status,
        validStatuses
      });
    }
    
    const order = await orderService.createOrder({
      userId,
      productId,
      status,
    });
    
    return reply.status(201).send(order);
  } catch (error) {
    request.log.error({ 
      error, 
      body: request.body 
    }, 'Failed to create order');
    
    // Обработка специфичных ошибок Prisma
    if (error instanceof Error) {
      // Ошибка внешнего ключа (пользователь или продукт не найден)
      if (error.message.includes('Foreign key constraint')) {
        return reply.status(404).send({ 
          error: 'User or Product not found',
          message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      
      // Ошибка уникальности или другие ошибки БД
      if (error.message.includes('Unique constraint')) {
        return reply.status(409).send({ 
          error: 'Order already exists',
          message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
      
      return reply.status(500).send({ 
        error: 'Failed to create order',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    return reply.status(500).send({ error: 'Failed to create order' });
  }
}