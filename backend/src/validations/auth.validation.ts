import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[@$!%*?&#]/, 'Password must contain at least one special character (@$!%*?&#)');

const indianPhoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'Phone must be in format +91XXXXXXXXXX (10 digits starting with 6-9)')
  .optional();

export const registerSchema = z.object({
  name:     z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email:    z.string().trim().email('Invalid email address').toLowerCase(),
  password: passwordSchema,
  phone:    indianPhoneSchema,
  role:     z.enum(['customer', 'owner']).optional().default('customer'),
});

export const loginSchema = z.object({
  email:    z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  // Refresh token comes from httpOnly cookie, validated in service
});

export const createAddressSchema = z.object({
  label:      z.string().trim().max(50).optional().default('Home'),
  flatHouse:  z.string().trim().min(1, 'Flat/House number is required').max(200),
  street:     z.string().trim().min(1, 'Street is required').max(200),
  area:       z.string().trim().min(1, 'Area is required').max(200),
  city:       z.string().trim().min(1, 'City is required').max(100),
  state:      z.string().trim().min(1, 'State is required').max(100),
  pinCode:    z.string().regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
  isDefault:  z.boolean().optional().default(false),
});

export const updateProfileSchema = z.object({
  name:   z.string().trim().min(2).max(100).optional(),
  phone:  indianPhoneSchema,
}).strict();

export type RegisterDto    = z.infer<typeof registerSchema>;
export type LoginDto       = z.infer<typeof loginSchema>;
export type CreateAddressDto = z.infer<typeof createAddressSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
