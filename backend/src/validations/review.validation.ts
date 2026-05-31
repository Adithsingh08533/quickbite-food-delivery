import { z } from 'zod';

export const createReviewSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const replyReviewSchema = z.object({
  reply: z.string().min(1).max(1000, 'Reply must not exceed 1000 characters'),
});
