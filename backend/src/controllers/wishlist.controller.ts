import { Request, Response } from 'express';
import pool from '../database';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const wishlistController = {
  toggleWishlist: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id || (req as any).user.userId;
    const { foodItemId } = req.body;

    // Check if it exists
    const check = await pool.query(
      `SELECT id FROM wishlist WHERE user_id = $1 AND food_item_id = $2`,
      [userId, foodItemId]
    );

    let message = '';
    if (check.rows.length > 0) {
      // Remove
      await pool.query(`DELETE FROM wishlist WHERE id = $1`, [check.rows[0].id]);
      message = 'Removed from wishlist';
    } else {
      // Add
      await pool.query(
        `INSERT INTO wishlist (user_id, food_item_id) VALUES ($1, $2)`,
        [userId, foodItemId]
      );
      message = 'Added to wishlist';
    }

    sendSuccess(res, null, message);
  }),

  getWishlist: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id || (req as any).user.userId;

    const result = await pool.query(
      `SELECT w.id as wishlist_id, f.*, r.name as restaurant_name 
       FROM wishlist w
       JOIN food_items f ON w.food_item_id = f.id
       JOIN restaurants r ON f.restaurant_id = r.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );

    sendSuccess(res, result.rows, 'Wishlist fetched successfully');
  })
};
