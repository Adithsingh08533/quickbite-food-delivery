import pool from '../database';
import { AppError } from '../utils/AppError';

export const reviewService = {
  createReview: async (userId: string, orderId: string, restaurantId: string, rating: number, comment?: string) => {
    // 1. Verify order belongs to user and is delivered, and fetch its restaurant_id
    const orderResult = await pool.query(
      `SELECT id, status, restaurant_id FROM orders WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError('Order not found or does not belong to you', 404);
    }
    
    // Ignore client-provided restaurantId, use the trusted one from the DB
    const actualRestaurantId = orderResult.rows[0].restaurant_id;

    if (orderResult.rows[0].status !== 'delivered') {
      throw new AppError('You can only review delivered orders', 400);
    }

    // 2. Check if already reviewed (caught by unique constraint uq_review_user_order but doing it cleanly here)
    const existingReview = await pool.query(
      `SELECT id FROM reviews WHERE user_id = $1 AND order_id = $2`,
      [userId, orderId]
    );

    if (existingReview.rows.length > 0) {
      throw new AppError('You have already reviewed this order', 400);
    }

    // 3. Insert review
    const result = await pool.query(
      `INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, rating, comment, created_at`,
      [userId, actualRestaurantId, orderId, rating, comment]
    );

    // 4. Update restaurant avg_rating and review_count
    await pool.query(
      `UPDATE restaurants 
       SET 
         review_count = review_count + 1,
         avg_rating = (
           SELECT ROUND(AVG(rating)::numeric, 1) 
           FROM reviews 
           WHERE restaurant_id = $1
         )
       WHERE id = $1`,
      [actualRestaurantId]
    );

    return result.rows[0];
  },

  getRestaurantReviews: async (restaurantId: string, limit = 20, offset = 0) => {
    const result = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.owner_reply, r.replied_at, r.created_at, 
              u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.restaurant_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [restaurantId, limit, offset]
    );
    
    // Get total count
    const countResult = await pool.query(`SELECT COUNT(*) FROM reviews WHERE restaurant_id = $1`, [restaurantId]);

    return {
      reviews: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  },

  replyToReview: async (ownerId: string, reviewId: string, reply: string) => {
    // Check if the review belongs to a restaurant owned by the owner
    const reviewCheck = await pool.query(
      `SELECT r.id FROM reviews r
       JOIN restaurants rest ON r.restaurant_id = rest.id
       WHERE r.id = $1 AND rest.owner_id = $2`,
      [reviewId, ownerId]
    );

    if (reviewCheck.rows.length === 0) {
      throw new AppError('Review not found or unauthorized', 404);
    }

    const result = await pool.query(
      `UPDATE reviews 
       SET owner_reply = $1, replied_at = NOW(), updated_at = NOW()
       WHERE id = $2
       RETURNING id, owner_reply, replied_at`,
      [reply, reviewId]
    );

    return result.rows[0];
  }
};
