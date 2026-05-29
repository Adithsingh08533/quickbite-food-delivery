import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { verifyPaymentSchema } from '../validations/order.validation';

const router = Router();

router.use(authenticateJWT, authorizeRole('customer'));

/**
 * @swagger
 * /payments/orders/{orderId}/razorpay:
 *   post:
 *     tags: [Payments]
 *     summary: Create a Razorpay order for payment
 *     description: |
 *       Creates a Razorpay order and returns the `razorpay_order_id` needed to initialize the Razorpay payment SDK on the frontend.
 *       Amount is in **paise** (INR × 100).
 *     parameters:
 *       - { in: path, name: orderId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       201:
 *         description: Razorpay order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 razorpayOrderId: { type: string, example: "order_xxxxxxxxxxxx" }
 *                 amount:          { type: integer, example: 45000, description: "Amount in paise" }
 *                 currency:        { type: string, example: "INR" }
 *                 keyId:           { type: string, example: "rzp_test_xxxxxxxxxxxx" }
 */
router.post('/orders/:orderId/razorpay', paymentController.createRazorpayOrder);

/**
 * @swagger
 * /payments/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify Razorpay payment signature (HMAC-SHA256)
 *     description: |
 *       **Call this after the user completes payment on the Razorpay SDK.**
 *       The server verifies the signature cryptographically — never trust client-reported success alone.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpayOrderId, razorpayPaymentId, razorpaySignature]
 *             properties:
 *               razorpayOrderId:   { type: string }
 *               razorpayPaymentId: { type: string }
 *               razorpaySignature: { type: string }
 *     responses:
 *       200: { description: Payment verified — order payment_status set to paid }
 *       400: { description: Invalid signature }
 */
router.post('/verify', validate('body', verifyPaymentSchema), paymentController.verifyPayment);

export default router;
