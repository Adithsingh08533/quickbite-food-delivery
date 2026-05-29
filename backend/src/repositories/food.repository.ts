import pool from '../database';
import { FoodItem, FoodItemWithCategory, CartItem, CartItemWithDetails } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapFoodItem = (row: Record<string, any>): FoodItem => ({
  id:           row.id,
  restaurantId: row.restaurant_id,
  categoryId:   row.category_id,
  name:         row.name,
  description:  row.description,
  price:        parseFloat(row.price),
  imageUrl:     row.image_url,
  isVeg:        row.is_veg,
  isAvailable:  row.is_available,
  isFeatured:   row.is_featured,
  prepTimeMin:  row.prep_time_min,
  createdAt:    row.created_at,
  updatedAt:    row.updated_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapCartItem = (row: Record<string, any>): CartItemWithDetails => ({
  id:             row.id,
  userId:         row.user_id,
  foodItemId:     row.food_item_id,
  restaurantId:   row.restaurant_id,
  quantity:       row.quantity,
  createdAt:      row.created_at,
  updatedAt:      row.updated_at,
  name:           row.name,
  price:          parseFloat(row.price),
  imageUrl:       row.image_url,
  isVeg:          row.is_veg,
  isAvailable:    row.is_available,
  restaurantName: row.restaurant_name,
});

export const foodRepository = {
  // ── Food Items ────────────────────────────────────────────────────
  async create(data: {
    restaurantId: string; categoryId?: string; name: string; description?: string;
    price: number; isVeg: boolean; isFeatured: boolean; prepTimeMin: number;
  }): Promise<FoodItem> {
    const result = await pool.query(
      `INSERT INTO food_items
         (restaurant_id, category_id, name, description, price, is_veg, is_featured, prep_time_min)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        data.restaurantId, data.categoryId ?? null, data.name,
        data.description ?? null, data.price, data.isVeg, data.isFeatured, data.prepTimeMin,
      ]
    );
    return mapFoodItem(result.rows[0]);
  },

  async findById(id: string): Promise<FoodItem | null> {
    const result = await pool.query('SELECT * FROM food_items WHERE id = $1', [id]);
    return result.rows[0] ? mapFoodItem(result.rows[0]) : null;
  },

  async findByRestaurant(
    restaurantId: string,
    opts?: { isVeg?: boolean; isAvailable?: boolean }
  ): Promise<FoodItemWithCategory[]> {
    const conditions = ['fi.restaurant_id = $1'];
    const params: unknown[] = [restaurantId];
    let idx = 2;

    if (opts?.isVeg !== undefined) { conditions.push(`fi.is_veg = $${idx++}`); params.push(opts.isVeg); }
    if (opts?.isAvailable !== undefined) { conditions.push(`fi.is_available = $${idx++}`); params.push(opts.isAvailable); }

    const result = await pool.query(
      `SELECT fi.*, fc.name AS category_name
       FROM food_items fi
       LEFT JOIN food_categories fc ON fc.id = fi.category_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY fc.display_order NULLS LAST, fi.created_at`,
      params
    );

    return result.rows.map(row => ({
      ...mapFoodItem(row),
      categoryName: row.category_name,
    }));
  },

  async update(id: string, data: Partial<{
    categoryId: string | null; name: string; description: string;
    price: number; imageUrl: string; isVeg: boolean;
    isAvailable: boolean; isFeatured: boolean; prepTimeMin: number;
  }>): Promise<FoodItem | null> {
    const fieldMap: Record<string, string> = {
      categoryId: 'category_id', name: 'name', description: 'description',
      price: 'price', imageUrl: 'image_url', isVeg: 'is_veg',
      isAvailable: 'is_available', isFeatured: 'is_featured', prepTimeMin: 'prep_time_min',
    };

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in data) {
        fields.push(`${col} = $${idx++}`);
        values.push(data[key as keyof typeof data]);
      }
    }
    if (fields.length === 0) return null;
    values.push(id);

    const result = await pool.query(
      `UPDATE food_items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] ? mapFoodItem(result.rows[0]) : null;
  },

  async delete(id: string): Promise<boolean> {
    // Soft delete: mark unavailable instead of hard delete (preserves order history)
    const result = await pool.query(
      'UPDATE food_items SET is_available = false WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  },

  // ── Cart ──────────────────────────────────────────────────────────
  async getCartByUser(userId: string): Promise<CartItemWithDetails[]> {
    const result = await pool.query(
      `SELECT
         ci.id, ci.user_id, ci.food_item_id, ci.restaurant_id, ci.quantity,
         ci.created_at, ci.updated_at,
         fi.name, fi.price, fi.image_url, fi.is_veg, fi.is_available,
         r.name AS restaurant_name
       FROM cart_items ci
       JOIN food_items fi ON fi.id = ci.food_item_id
       JOIN restaurants r ON r.id = ci.restaurant_id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at`,
      [userId]
    );
    return result.rows.map(mapCartItem);
  },

  async addToCart(data: {
    userId: string; foodItemId: string; restaurantId: string; quantity: number;
  }): Promise<CartItemWithDetails> {
    // UPSERT: if same user+food exists, increment quantity
    const result = await pool.query(
      `INSERT INTO cart_items (user_id, food_item_id, restaurant_id, quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT ON CONSTRAINT uq_cart_user_food
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING *`,
      [data.userId, data.foodItemId, data.restaurantId, data.quantity]
    );

    // Fetch with joined details
    const full = await pool.query(
      `SELECT
         ci.id, ci.user_id, ci.food_item_id, ci.restaurant_id, ci.quantity,
         ci.created_at, ci.updated_at,
         fi.name, fi.price, fi.image_url, fi.is_veg, fi.is_available,
         r.name AS restaurant_name
       FROM cart_items ci
       JOIN food_items fi ON fi.id = ci.food_item_id
       JOIN restaurants r ON r.id = ci.restaurant_id
       WHERE ci.id = $1`,
      [result.rows[0].id]
    );
    return mapCartItem(full.rows[0]);
  },

  async updateCartItem(id: string, userId: string, quantity: number): Promise<CartItemWithDetails | null> {
    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING id',
      [quantity, id, userId]
    );
    if (!result.rows[0]) return null;

    const full = await pool.query(
      `SELECT ci.*, fi.name, fi.price, fi.image_url, fi.is_veg, fi.is_available,
              r.name AS restaurant_name
       FROM cart_items ci
       JOIN food_items fi ON fi.id = ci.food_item_id
       JOIN restaurants r ON r.id = ci.restaurant_id
       WHERE ci.id = $1`,
      [result.rows[0].id]
    );
    return mapCartItem(full.rows[0]);
  },

  async removeFromCart(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async clearCart(userId: string): Promise<void> {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  },

  async getCartRestaurantId(userId: string): Promise<string | null> {
    const result = await pool.query(
      'SELECT restaurant_id FROM cart_items WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    return result.rows[0]?.restaurant_id ?? null;
  },
};
