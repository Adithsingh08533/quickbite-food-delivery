import { Request, Response } from 'express';
import pool from '../database';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

export const couponController = {
  createCoupon: asyncHandler(async (req: Request, res: Response) => {
    const {
      code, description, discount_type, discount_value, min_order_amount,
      max_discount, usage_limit, expires_at
    } = req.body;

    const result = await pool.query(
      `INSERT INTO coupons 
        (code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [code.toUpperCase(), description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, expires_at]
    );

    sendCreated(res, result.rows[0], 'Coupon created successfully');
  }),

  getCoupons: asyncHandler(async (req: Request, res: Response) => {
    const result = await pool.query(
      `SELECT * FROM coupons ORDER BY created_at DESC`
    );
    sendSuccess(res, result.rows, 'Coupons fetched successfully');
  }),

  validateCoupon: asyncHandler(async (req: Request, res: Response) => {
    const { code, cartTotal } = req.body;

    if (!code || !cartTotal) {
      throw new AppError('Code and cartTotal are required', 400);
    }

    const result = await pool.query(
      `SELECT * FROM coupons WHERE code = $1 AND is_active = true`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid or inactive coupon', 400);
    }

    const coupon = result.rows[0];

    // Check expiry
    if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
      throw new AppError('Coupon has expired', 400);
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      throw new AppError('Coupon usage limit reached', 400);
    }

    // Check min order amount
    if (cartTotal < Number(coupon.min_order_amount)) {
      throw new AppError(`Minimum order amount is ₹${coupon.min_order_amount}`, 400);
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'flat') {
      discountAmount = Number(coupon.discount_value);
    } else if (coupon.discount_type === 'percentage') {
      discountAmount = (cartTotal * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount && discountAmount > Number(coupon.max_discount)) {
        discountAmount = Number(coupon.max_discount);
      }
    }

    // Cap discount to cart total
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    sendSuccess(res, { coupon, discountAmount }, 'Coupon applied successfully');
  })
};
