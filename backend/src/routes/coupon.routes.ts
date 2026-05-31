import { Router } from 'express';
import { couponController } from '../controllers/coupon.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createCouponSchema } from '../validations/coupon.validation';

const router = Router();

// Public / Customer: validate coupon
router.post('/validate', couponController.validateCoupon);

// Admin only: create and view all coupons
router.use(authenticateJWT, authorizeRole('admin'));
router.post('/', validate('body', createCouponSchema), couponController.createCoupon);
router.get('/', couponController.getCoupons);

export default router;
