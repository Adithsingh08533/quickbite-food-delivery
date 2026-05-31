import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  placeOrderSchema, updateOrderStatusSchema, orderQuerySchema,
} from '../validations/order.validation';

const router = Router();

router.use(authenticateJWT);

/**
 * @swagger
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place a new order from cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deliveryAddressId, paymentMethod]
 *             properties:
 *               deliveryAddressId:   { type: string, format: uuid }
 *               paymentMethod:       { type: string, enum: [online, cod] }
 *               couponCode:          { type: string, example: "WELCOME50" }
 *               specialInstructions: { type: string }
 *     responses:
 *       201: { description: Order placed successfully with full order details }
 *       400: { description: Empty cart / min order / unavailable items }
 *   get:
 *     tags: [Orders]
 *     summary: Get current customer's order history
 *     parameters:
 *       - { in: query, name: status, schema: { type: string } }
 *       - { in: query, name: page,   schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,  schema: { type: integer, default: 10 } }
 */
router.post(
  '/',
  authorizeRole('customer'),
  validate('body', placeOrderSchema),
  orderController.placeOrder
);
router.get(
  '/',
  authorizeRole('customer'),
  validate('query', orderQuerySchema),
  orderController.getMyOrders
);

/**
 * @swagger
 * /orders/restaurant/{restaurantId}:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders for a restaurant (owner only)
 */
router.get(
  '/restaurant/:restaurantId',
  authorizeRole('owner'),
  validate('query', orderQuerySchema),
  orderController.getRestaurantOrders
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get an order by ID (customer sees own, owner sees restaurant orders, admin sees all)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 */
router.get('/:id', orderController.getOrderById);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (owner/admin)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 */
router.patch(
  '/:id/status',
  authorizeRole('owner', 'admin'),
  validate('body', updateOrderStatusSchema),
  orderController.updateOrderStatus
);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel an order (customer)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 */
router.post(
  '/:id/cancel',
  orderController.cancelOrder
);

export default router;
