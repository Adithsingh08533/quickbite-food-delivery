import { Router } from 'express';
import { wishlistController } from '../controllers/wishlist.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateJWT);
router.use(authorizeRole('customer'));

router.get('/', wishlistController.getWishlist);
router.post('/toggle', wishlistController.toggleWishlist);

export default router;
