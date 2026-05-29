import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Registration, login, token refresh, and logout
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: "Arjun Sharma" }
 *               email:    { type: string, format: email, example: "arjun@example.com" }
 *               password: { type: string, example: "Demo@123", description: "Min 8 chars, uppercase, lowercase, number, special char" }
 *               phone:    { type: string, example: "+919876543210" }
 *               role:     { type: string, enum: [customer, owner], default: customer }
 *     responses:
 *       201: { description: Account created, content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       409: { description: Email already exists }
 *       422: { description: Validation error }
 */
router.post('/register', authRateLimiter, validate('body', registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive access token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email, example: "customer1@demo.com" }
 *               password: { type: string, example: "Demo@123" }
 *     responses:
 *       200: { description: Login successful with accessToken in body and refreshToken in httpOnly cookie }
 *       401: { description: Invalid credentials }
 *       403: { description: Account banned }
 */
router.post('/login', authRateLimiter, validate('body', loginSchema), authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Get a new access token using the refresh token cookie
 *     security: []
 *     description: The refresh token is read from the httpOnly cookie. Call this endpoint when the access token expires (401).
 *     responses:
 *       200: { description: New accessToken issued }
 *       401: { description: No/invalid/expired refresh token }
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout — revoke refresh token and clear cookie
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', authController.logout);

export default router;
