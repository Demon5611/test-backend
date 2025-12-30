import { FastifyInstance } from 'fastify';
import {
  getOrders,
  getOrderById,
  createOrder,
} from '../controllers/orderController.js';

export default async function ordersRoutes(fastify: FastifyInstance) {
  // GET /api/orders - чтение с Replica
  fastify.get('/orders', getOrders);
  
  // GET /api/orders/:id - чтение с Replica
  fastify.get('/orders/:id', getOrderById);
  
  // POST /api/orders - запись на Master
  fastify.post('/orders', createOrder);
}