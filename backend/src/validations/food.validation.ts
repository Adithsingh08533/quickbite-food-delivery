import { z } from 'zod';

export const createFoodItemSchema = z.object({
  categoryId:   z.string().uuid('Invalid category ID').optional(),
  name:         z.string().trim().min(2).max(200),
  description:  z.string().trim().max(1000).optional(),
  price:        z.number().positive('Price must be greater than 0').max(100000),
  isVeg:        z.boolean().optional().default(true),
  isFeatured:   z.boolean().optional().default(false),
  prepTimeMin:  z.number().int().min(1).max(180).optional().default(20),
});

export const updateFoodItemSchema = z.object({
  categoryId:   z.string().uuid().nullable().optional(),
  name:         z.string().trim().min(2).max(200).optional(),
  description:  z.string().trim().max(1000).optional(),
  price:        z.number().positive().max(100000).optional(),
  isVeg:        z.boolean().optional(),
  isAvailable:  z.boolean().optional(),
  isFeatured:   z.boolean().optional(),
  prepTimeMin:  z.number().int().min(1).max(180).optional(),
}).strict();

export const addToCartSchema = z.object({
  foodItemId: z.string().uuid('Invalid food item ID'),
  quantity:   z.number().int().min(1, 'Quantity must be at least 1').max(20, 'Maximum 20 items'),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(20),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export type CreateFoodItemDto   = z.infer<typeof createFoodItemSchema>;
export type UpdateFoodItemDto   = z.infer<typeof updateFoodItemSchema>;
export type AddToCartDto        = z.infer<typeof addToCartSchema>;
export type UpdateCartItemDto   = z.infer<typeof updateCartItemSchema>;
