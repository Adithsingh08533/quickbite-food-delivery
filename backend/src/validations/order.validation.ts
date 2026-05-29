import { z } from 'zod';

export const placeOrderSchema = z.object({
  deliveryAddressId:    z.string().uuid('Invalid address ID'),
  paymentMethod:        z.enum(['online', 'cod']),
  couponCode:           z.string().trim().toUpperCase().optional(),
  specialInstructions:  z.string().trim().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'accepted', 'preparing', 'ready_for_pickup',
    'out_for_delivery', 'delivered', 'cancelled',
  ]),
  cancellationReason: z.string().trim().max(300).optional(),
});

export const orderQuerySchema = z.object({
  status:   z.enum(['pending', 'accepted', 'preparing', 'ready_for_pickup',
                    'out_for_delivery', 'delivered', 'cancelled']).optional(),
  page:     z.coerce.number().int().min(1).optional().default(1),
  limit:    z.coerce.number().int().min(1).max(50).optional().default(10),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId:    z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId:  z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature:  z.string().min(1, 'Razorpay signature is required'),
});

export type PlaceOrderDto         = z.infer<typeof placeOrderSchema>;
export type UpdateOrderStatusDto  = z.infer<typeof updateOrderStatusSchema>;
export type OrderQueryDto         = z.infer<typeof orderQuerySchema>;
export type VerifyPaymentDto      = z.infer<typeof verifyPaymentSchema>;
