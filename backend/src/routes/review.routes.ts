import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createReviewSchema, replyReviewSchema } from '../validations/review.validation';

const router = Router();

// Public: Get restaurant reviews
router.get('/restaurant/:restaurantId', reviewController.getRestaurantReviews);

// Protected: Customer creates a review
router.post('/', authenticateJWT, authorizeRole('customer'), validate('body', createReviewSchema), reviewController.createReview);

// Protected: Owner replies to a review
router.post('/:reviewId/reply', authenticateJWT, authorizeRole('owner'), validate('body', replyReviewSchema), reviewController.replyToReview);

export default router;
