import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/orderService.js';

const orderService = new OrderService();

export async function getOrders(
  request: FastifyRequest<{ Querystring: { userId?: string } }>,
  reply: FastifyReply
) {
  try {
    const { userId } = request.query;
    const orders = await orderService.getOrders(userId);
    return reply.send({ orders, count: orders.length });
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to fetch orders' });
  }
}

export async function getOrderById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const order = await orderService.getOrderById(id);
    
    if (!order) {
      return reply.status(404).send({ error: 'Order not found' });
    }
    
    return reply.send(order);
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to fetch order' });
  }
}

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
    
    if (!userId || !productId) {
      return reply.status(400).send({ 
        error: 'userId and productId are required' 
      });
    }
    
    const order = await orderService.createOrder({
      userId,
      productId,
      status,
    });
    
    return reply.status(201).send(order);
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to create order' });
  }
}