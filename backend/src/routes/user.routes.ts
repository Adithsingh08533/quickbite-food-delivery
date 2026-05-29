import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';
import { uploadRateLimiter } from '../middleware/rateLimiter.middleware';
import { updateProfileSchema, createAddressSchema } from '../validations/auth.validation';

const router = Router();

// All user routes require authentication
router.use(authenticateJWT);

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     responses:
 *       200: { description: Profile data }
 *   patch:
 *     tags: [Users]
 *     summary: Update current user profile
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:  { type: string }
 *               phone: { type: string, example: "+919876543210" }
 *     responses:
 *       200: { description: Profile updated }
 */
router.get('/me', userController.getProfile);
router.patch('/me', validate('body', updateProfileSchema), userController.updateProfile);

/**
 * @swagger
 * /users/me/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload a profile avatar image
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *     responses:
 *       200: { description: Avatar updated, returns public URL }
 */
router.post('/me/avatar', uploadRateLimiter, upload.single('image'), userController.uploadAvatar);

/**
 * @swagger
 * /users/addresses:
 *   get:
 *     tags: [Users]
 *     summary: Get all saved delivery addresses
 *     responses:
 *       200: { description: List of addresses }
 *   post:
 *     tags: [Users]
 *     summary: Add a new delivery address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [flatHouse, street, area, city, state, pinCode]
 *             properties:
 *               label:     { type: string, example: "Home" }
 *               flatHouse: { type: string, example: "Flat 12, Sunrise Apts" }
 *               street:    { type: string, example: "MG Road" }
 *               area:      { type: string, example: "Indiranagar" }
 *               city:      { type: string, example: "Bengaluru" }
 *               state:     { type: string, example: "Karnataka" }
 *               pinCode:   { type: string, example: "560038" }
 *               isDefault: { type: boolean, default: false }
 *     responses:
 *       201: { description: Address added }
 */
router.get('/addresses', userController.getAddresses);
router.post('/addresses', validate('body', createAddressSchema), userController.createAddress);

/**
 * @swagger
 * /users/addresses/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a delivery address
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Address deleted }
 *       404: { description: Address not found }
 */
router.delete('/addresses/:id', userController.deleteAddress);

export default router;
