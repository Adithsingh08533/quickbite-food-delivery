import { z } from 'zod';

const CUISINE_TYPES = [
  'North Indian', 'South Indian', 'Chinese', 'Fast Food',
  'Biryani', 'Desserts', 'Beverages', 'Italian', 'Mexican',
  'Thai', 'Continental', 'Mughlai', 'Street Food', 'Seafood',
] as const;

const pinCodeSchema = z.string().regex(/^\d{6}$/, 'PIN code must be exactly 6 digits');

const phoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'Phone must be +91XXXXXXXXXX format');

export const createRestaurantSchema = z.object({
  name:             z.string().trim().min(2).max(200),
  description:      z.string().trim().max(2000).optional(),
  cuisineType:      z.string().trim().min(1).max(100),
  phone:            phoneSchema,
  address:          z.string().trim().min(5).max(500),
  city:             z.string().trim().min(1).max(100),
  state:            z.string().trim().min(1).max(100).optional().default('Karnataka'),
  pinCode:          pinCodeSchema,
  deliveryFee:      z.number().min(0).max(500).optional().default(30),
  minOrderAmount:   z.number().min(0).max(10000).optional().default(100),
  deliveryTimeMin:  z.number().int().min(5).max(120).optional().default(30),
  gstin:            z.string().trim().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'Invalid GSTIN').optional(),
  fssaiNumber:      z.string().trim().min(14).max(14).optional(),
});

export const updateRestaurantSchema = z.object({
  name:             z.string().trim().min(2).max(200).optional(),
  description:      z.string().trim().max(2000).optional(),
  cuisineType:      z.string().trim().min(1).max(100).optional(),
  phone:            phoneSchema.optional(),
  address:          z.string().trim().min(5).max(500).optional(),
  city:             z.string().trim().min(1).max(100).optional(),
  state:            z.string().trim().min(1).max(100).optional(),
  pinCode:          pinCodeSchema.optional(),
  deliveryFee:      z.number().min(0).max(500).optional(),
  minOrderAmount:   z.number().min(0).max(10000).optional(),
  deliveryTimeMin:  z.number().int().min(5).max(120).optional(),
  gstin:            z.string().optional(),
  fssaiNumber:      z.string().optional(),
}).strict();

export const restaurantQuerySchema = z.object({
  city:         z.string().trim().optional(),
  cuisineType:  z.string().trim().optional(),
  search:       z.string().trim().max(100).optional(),
  isVeg:        z.enum(['true', 'false']).optional(),
  isOpen:       z.enum(['true', 'false']).optional(),
  sortBy:       z.enum(['rating', 'deliveryTime', 'deliveryFee']).optional(),
  page:         z.coerce.number().int().min(1).optional().default(1),
  limit:        z.coerce.number().int().min(1).max(50).optional().default(12),
});

export const createCategorySchema = z.object({
  name:           z.string().trim().min(1).max(100),
  description:    z.string().trim().max(500).optional(),
  displayOrder:   z.number().int().min(0).optional().default(0),
});

export const updateCategorySchema = createCategorySchema.partial().strict();

export type CreateRestaurantDto = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantDto = z.infer<typeof updateRestaurantSchema>;
export type RestaurantQueryDto  = z.infer<typeof restaurantQuerySchema>;
export type CreateCategoryDto   = z.infer<typeof createCategorySchema>;

// Exported for use in docs
export { CUISINE_TYPES };
