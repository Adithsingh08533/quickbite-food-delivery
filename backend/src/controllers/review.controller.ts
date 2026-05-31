import { Request, Response } from 'express';
import { reviewService } from '../services/review.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

export const reviewController = {
  createReview: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { orderId, restaurantId, rating, comment } = req.body;

    const review = await reviewService.createReview(userId, orderId, restaurantId, rating, comment);

    sendCreated(res, review, 'Review submitted successfully');
  }),

  getRestaurantReviews: asyncHandler(async (req: Request, res: Response) => {
    const restaurantId = req.params.restaurantId as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const data = await reviewService.getRestaurantReviews(restaurantId, limit, offset);

    sendSuccess(res, data, 'Reviews fetched successfully');
  }),

  replyToReview: asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user!.userId;
    const reviewId = req.params.reviewId as string;
    const { reply } = req.body;

    const updatedReview = await reviewService.replyToReview(ownerId, reviewId, reply);

    sendSuccess(res, updatedReview, 'Reply posted successfully');
  })
};
