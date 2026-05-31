import { z } from 'zod';

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(30),
    description: z.string().optional(),
    discount_type: z.enum(['percentage', 'flat']),
    discount_value: z.number().positive(),
    min_order_amount: z.number().min(0).default(0),
    max_discount: z.number().positive().optional(),
    usage_limit: z.number().int().positive().optional(),
    expires_at: z.string().datetime().optional()
  }),
});
