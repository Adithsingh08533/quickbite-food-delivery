import { Router } from 'express';
import { restaurantController } from '../controllers/restaurant.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';
import { uploadRateLimiter } from '../middleware/rateLimiter.middleware';
import {
  createRestaurantSchema, updateRestaurantSchema,
  restaurantQuerySchema, createCategorySchema,
} from '../validations/restaurant.validation';

const router = Router();

/**
 * @swagger
 * /restaurants:
 *   get:
 *     tags: [Restaurants]
 *     summary: Browse all approved restaurants (public, paginated)
 *     security: []
 *     parameters:
 *       - { in: query, name: city,        schema: { type: string }, example: Bengaluru }
 *       - { in: query, name: cuisineType, schema: { type: string }, example: "North Indian" }
 *       - { in: query, name: search,      schema: { type: string } }
 *       - { in: query, name: isOpen,      schema: { type: boolean } }
 *       - { in: query, name: sortBy,      schema: { type: string, enum: [rating, deliveryTime, deliveryFee] } }
 *       - { in: query, name: page,        schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,       schema: { type: integer, default: 12 } }
 *     responses:
 *       200: { description: Paginated restaurant list }
 */
router.get('/', validate('query', restaurantQuerySchema), restaurantController.getRestaurants);

/**
 * @swagger
 * /restaurants:
 *   post:
 *     tags: [Restaurants]
 *     summary: Create a restaurant (owner only)
 *     responses:
 *       201: { description: Restaurant created }
 */
router.post(
  '/',
  authenticateJWT, authorizeRole('owner'),
  validate('body', createRestaurantSchema),
  restaurantController.createRestaurant
);
/**
 * @swagger
 * /restaurants/nearby:
 *   get:
 *     tags: [Restaurants]
 *     summary: Browse nearby restaurants (public, paginated)
 *     security: []
 *     parameters:
 *       - { in: query, name: lat, schema: { type: number }, required: true }
 *       - { in: query, name: lng, schema: { type: number }, required: true }
 *       - { in: query, name: radius, schema: { type: number }, required: true }
 *     responses:
 *       200: { description: Paginated restaurant list sorted by distance }
 */
router.get('/nearby', restaurantController.getNearbyRestaurants);

/**
 * @swagger
 * /restaurants/my:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get the logged-in owner's restaurants
 *     responses:
 *       200: { description: Owner's restaurant list }
 */
router.get('/my', authenticateJWT, authorizeRole('owner'), restaurantController.getMyRestaurants);

/**
 * @swagger
 * /restaurants/{id}:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get restaurant details by ID (public)
 *     security: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Restaurant details }
 *       404: { description: Restaurant not found }
 */
router.get('/:id', restaurantController.getRestaurantById);

/**
 * @swagger
 * /restaurants/{id}:
 *   patch:
 *     tags: [Restaurants]
 *     summary: Update restaurant details (owner/admin)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Restaurant updated }
 */
router.patch(
  '/:id',
  authenticateJWT, authorizeRole('owner', 'admin'),
  validate('body', updateRestaurantSchema),
  restaurantController.updateRestaurant
);

/**
 * @swagger
 * /restaurants/{id}/toggle:
 *   patch:
 *     tags: [Restaurants]
 *     summary: Toggle restaurant open/closed status
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Toggle successful }
 */
router.patch('/:id/toggle', authenticateJWT, authorizeRole('owner'), restaurantController.toggleOpen);

/**
 * @swagger
 * /restaurants/{id}/image:
 *   post:
 *     tags: [Restaurants]
 *     summary: Upload restaurant cover image
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, properties: { image: { type: string, format: binary } } }
 */
router.post(
  '/:id/image',
  authenticateJWT, authorizeRole('owner'),
  uploadRateLimiter, upload.single('image'),
  restaurantController.uploadRestaurantImage
);

// ── Categories ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /restaurants/{restaurantId}/categories:
 *   get:
 *     tags: [Restaurants]
 *     summary: Get food categories for a restaurant (public)
 *     security: []
 *     parameters:
 *       - { in: path, name: restaurantId, required: true, schema: { type: string, format: uuid } }
 *   post:
 *     tags: [Restaurants]
 *     summary: Create a food category (owner only)
 */
router.get('/:restaurantId/categories', restaurantController.getCategories);
router.post(
  '/:restaurantId/categories',
  authenticateJWT, authorizeRole('owner'),
  validate('body', createCategorySchema),
  restaurantController.createCategory
);
router.delete(
  '/:restaurantId/categories/:id',
  authenticateJWT, authorizeRole('owner'),
  restaurantController.deleteCategory
);

export default router;
