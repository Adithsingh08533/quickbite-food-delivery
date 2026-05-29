import { Router } from 'express';
import authRoutes        from './auth.routes';
import userRoutes        from './user.routes';
import restaurantRoutes  from './restaurant.routes';
import foodRoutes, { cartRouter } from './food.routes';
import orderRoutes       from './order.routes';
import paymentRoutes     from './payment.routes';
import adminRoutes       from './admin.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth',          authRoutes);
router.use('/users',         userRoutes);
router.use('/restaurants',   restaurantRoutes);

// Food items are nested under restaurants
router.use('/restaurants/:restaurantId/food-items', foodRoutes);

router.use('/cart',          cartRouter);
router.use('/orders',        orderRoutes);
router.use('/payments',      paymentRoutes);
router.use('/admin',         adminRoutes);
router.use('/notifications', notificationRoutes);

export default router;
