import { Router } from 'express';
import { foodController } from '../controllers/food.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';
import { uploadRateLimiter } from '../middleware/rateLimiter.middleware';
import {
  createFoodItemSchema, updateFoodItemSchema,
  addToCartSchema, updateCartItemSchema,
} from '../validations/food.validation';

const router = Router({ mergeParams: true });

// ── Food Items (mounted at /restaurants/:restaurantId/food-items) ──────────────

/**
 * @swagger
 * /restaurants/{restaurantId}/food-items:
 *   get:
 *     tags: [Food]
 *     summary: Get all food items for a restaurant (public)
 *     security: []
 *     parameters:
 *       - { in: path,  name: restaurantId, required: true, schema: { type: string, format: uuid } }
 *       - { in: query, name: isVeg, schema: { type: boolean } }
 *     responses:
 *       200: { description: Food items grouped by category }
 *   post:
 *     tags: [Food]
 *     summary: Add a food item to the menu (owner only)
 */
router.get('/', foodController.getFoodItems);
router.post(
  '/',
  authenticateJWT, authorizeRole('owner'),
  validate('body', createFoodItemSchema),
  foodController.createFoodItem
);

/**
 * @swagger
 * /food-items/{id}:
 *   patch:
 *     tags: [Food]
 *     summary: Update a food item (owner only)
 *   delete:
 *     tags: [Food]
 *     summary: Remove a food item from menu (soft delete — owner only)
 */
router.patch(
  '/:id',
  authenticateJWT, authorizeRole('owner'),
  validate('body', updateFoodItemSchema),
  foodController.updateFoodItem
);
router.delete('/:id', authenticateJWT, authorizeRole('owner'), foodController.deleteFoodItem);

/**
 * @swagger
 * /food-items/{id}/image:
 *   post:
 *     tags: [Food]
 *     summary: Upload food item image (owner only)
 */
router.post(
  '/:id/image',
  authenticateJWT, authorizeRole('owner'),
  uploadRateLimiter, upload.single('image'),
  foodController.uploadFoodImage
);

export default router;

// ── Cart Router (mounted at /cart) ────────────────────────────────────────────

export const cartRouter = Router();

/**
 * @swagger
 * /cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get current user's cart
 *     responses:
 *       200: { description: Cart items with subtotal }
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart (or increment quantity if already in cart)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [foodItemId, quantity]
 *             properties:
 *               foodItemId: { type: string, format: uuid }
 *               quantity:   { type: integer, example: 2 }
 *   delete:
 *     tags: [Cart]
 *     summary: Clear the entire cart
 */
cartRouter.use(authenticateJWT, authorizeRole('customer'));
cartRouter.get('/', foodController.getCart);
cartRouter.post('/', validate('body', addToCartSchema), foodController.addToCart);
cartRouter.delete('/', foodController.clearCart);

/**
 * @swagger
 * /cart/{id}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update quantity of a cart item
 *   delete:
 *     tags: [Cart]
 *     summary: Remove a specific item from cart
 */
cartRouter.patch('/:id', validate('body', updateCartItemSchema), foodController.updateCartItem);
cartRouter.delete('/:id', foodController.removeFromCart);
