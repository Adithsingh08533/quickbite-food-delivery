import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateJWT, authorizeRole('admin'));

/**
 * @swagger
 * /admin/restaurants:
 *   get:
 *     tags: [Admin]
 *     summary: Get all restaurants with optional approval status filter
 *     parameters:
 *       - { in: query, name: approvalStatus, schema: { type: string, enum: [pending, approved, rejected] } }
 *       - { in: query, name: page,  schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10 } }
 *     responses:
 *       200: { description: Paginated restaurant list with owner details }
 */
router.get('/restaurants', adminController.getRestaurants);

/**
 * @swagger
 * /admin/restaurants/{id}/approve:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve a pending restaurant
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Restaurant approved — now visible to customers }
 */
router.patch('/restaurants/:id/approve', adminController.approveRestaurant);

/**
 * @swagger
 * /admin/restaurants/{id}/reject:
 *   patch:
 *     tags: [Admin]
 *     summary: Reject a restaurant with a reason
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string, example: "Incomplete license documentation" }
 */
router.patch('/restaurants/:id/reject', adminController.rejectRestaurant);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users with optional role filter
 *     parameters:
 *       - { in: query, name: role, schema: { type: string, enum: [customer, owner, admin] } }
 */
router.get('/users', adminController.getUsers);

/**
 * @swagger
 * /admin/users/{id}/ban:
 *   patch:
 *     tags: [Admin]
 *     summary: Ban a user (revokes all sessions immediately)
 */
router.patch('/users/:id/ban', adminController.banUser);

/**
 * @swagger
 * /admin/users/{id}/unban:
 *   patch:
 *     tags: [Admin]
 *     summary: Unban a previously banned user
 */
router.patch('/users/:id/unban', adminController.unbanUser);

export default router;
