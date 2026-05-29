import pool from '../database';
import { Order, OrderItem, OrderWithItems } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapOrder = (row: Record<string, any>): Order => ({
  id:                   row.id,
  orderNumber:          row.order_number,
  userId:               row.user_id,
  restaurantId:         row.restaurant_id,
  deliveryAddressId:    row.delivery_address_id,
  couponId:             row.coupon_id,
  status:               row.status,
  paymentMethod:        row.payment_method,
  paymentStatus:        row.payment_status,
  subtotal:             parseFloat(row.subtotal),
  deliveryFee:          parseFloat(row.delivery_fee),
  discountAmount:       parseFloat(row.discount_amount),
  totalAmount:          parseFloat(row.total_amount),
  specialInstructions:  row.special_instructions,
  estimatedDeliveryAt:  row.estimated_delivery_at,
  placedAt:             row.placed_at,
  acceptedAt:           row.accepted_at,
  preparingAt:          row.preparing_at,
  readyAt:              row.ready_at,
  pickedUpAt:           row.picked_up_at,
  deliveredAt:          row.delivered_at,
  cancelledAt:          row.cancelled_at,
  cancellationReason:   row.cancellation_reason,
  updatedAt:            row.updated_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapOrderItem = (row: Record<string, any>): OrderItem => ({
  id:           row.id,
  orderId:      row.order_id,
  foodItemId:   row.food_item_id,
  foodName:     row.food_name,
  foodImageUrl: row.food_image_url,
  unitPrice:    parseFloat(row.unit_price),
  quantity:     row.quantity,
  totalPrice:   parseFloat(row.total_price),
  isVeg:        row.is_veg,
});

export const orderRepository = {
  async create(data: {
    orderNumber: string;
    userId: string;
    restaurantId: string;
    deliveryAddressId: string;
    couponId?: string;
    paymentMethod: string;
    subtotal: number;
    deliveryFee: number;
    discountAmount: number;
    totalAmount: number;
    specialInstructions?: string;
    items: Array<{
      foodItemId: string; foodName: string; foodImageUrl?: string;
      unitPrice: number; quantity: number; totalPrice: number; isVeg: boolean;
    }>;
  }): Promise<OrderWithItems> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert order
      const orderResult = await client.query(
        `INSERT INTO orders
           (order_number, user_id, restaurant_id, delivery_address_id, coupon_id,
            payment_method, subtotal, delivery_fee, discount_amount, total_amount,
            special_instructions)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [
          data.orderNumber, data.userId, data.restaurantId, data.deliveryAddressId,
          data.couponId ?? null, data.paymentMethod, data.subtotal, data.deliveryFee,
          data.discountAmount, data.totalAmount, data.specialInstructions ?? null,
        ]
      );

      const order = mapOrder(orderResult.rows[0]);

      // Insert order items
      const items: OrderItem[] = [];
      for (const item of data.items) {
        const itemResult = await client.query(
          `INSERT INTO order_items
             (order_id, food_item_id, food_name, food_image_url, unit_price, quantity, total_price, is_veg)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [
            order.id, item.foodItemId, item.foodName, item.foodImageUrl ?? null,
            item.unitPrice, item.quantity, item.totalPrice, item.isVeg,
          ]
        );
        items.push(mapOrderItem(itemResult.rows[0]));
      }

      // Get restaurant info for response
      const restResult = await client.query(
        'SELECT name, image_url FROM restaurants WHERE id = $1', [data.restaurantId]
      );

      await client.query('COMMIT');

      return {
        ...order,
        items,
        restaurantName: restResult.rows[0]?.name ?? '',
        restaurantImageUrl: restResult.rows[0]?.image_url ?? null,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async findById(id: string): Promise<OrderWithItems | null> {
    const [orderResult, itemsResult] = await Promise.all([
      pool.query(
        `SELECT o.*, r.name AS restaurant_name, r.image_url AS restaurant_image_url
         FROM orders o
         JOIN restaurants r ON r.id = o.restaurant_id
         WHERE o.id = $1`,
        [id]
      ),
      pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]),
    ]);

    if (!orderResult.rows[0]) return null;

    const row = orderResult.rows[0];
    return {
      ...mapOrder(row),
      items: itemsResult.rows.map(mapOrderItem),
      restaurantName: row.restaurant_name,
      restaurantImageUrl: row.restaurant_image_url,
    };
  },

  async findByUser(userId: string, opts: { status?: string; page: number; limit: number }): Promise<{
    orders: OrderWithItems[]; total: number;
  }> {
    const params: unknown[] = [userId];
    let where = 'WHERE o.user_id = $1';
    let idx = 2;

    if (opts.status) {
      where += ` AND o.status = $${idx++}`;
      params.push(opts.status);
    }

    const offset = (opts.page - 1) * opts.limit;
    params.push(opts.limit, offset);

    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT o.*, r.name AS restaurant_name, r.image_url AS restaurant_image_url
         FROM orders o
         JOIN restaurants r ON r.id = o.restaurant_id
         ${where} ORDER BY o.placed_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        params
      ),
      pool.query(`SELECT COUNT(*) FROM orders o ${where}`, params.slice(0, idx - 1)),
    ]);

    const orders = await Promise.all(
      dataRes.rows.map(async row => {
        const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [row.id]);
        return {
          ...mapOrder(row),
          items: itemsRes.rows.map(mapOrderItem),
          restaurantName: row.restaurant_name,
          restaurantImageUrl: row.restaurant_image_url,
        };
      })
    );

    return { orders, total: parseInt(countRes.rows[0].count, 10) };
  },

  async findByRestaurant(restaurantId: string, opts: { status?: string; page: number; limit: number }): Promise<{
    orders: OrderWithItems[]; total: number;
  }> {
    const params: unknown[] = [restaurantId];
    let where = 'WHERE o.restaurant_id = $1';
    let idx = 2;

    if (opts.status) {
      where += ` AND o.status = $${idx++}`;
      params.push(opts.status);
    }

    const offset = (opts.page - 1) * opts.limit;
    params.push(opts.limit, offset);

    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT o.*, r.name AS restaurant_name, r.image_url AS restaurant_image_url,
                u.name AS customer_name
         FROM orders o
         JOIN restaurants r ON r.id = o.restaurant_id
         JOIN users u ON u.id = o.user_id
         ${where} ORDER BY o.placed_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        params
      ),
      pool.query(`SELECT COUNT(*) FROM orders o ${where}`, params.slice(0, idx - 1)),
    ]);

    const orders = await Promise.all(
      dataRes.rows.map(async row => {
        const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [row.id]);
        return {
          ...mapOrder(row),
          items: itemsRes.rows.map(mapOrderItem),
          restaurantName: row.restaurant_name,
          restaurantImageUrl: row.restaurant_image_url,
        };
      })
    );

    return { orders, total: parseInt(countRes.rows[0].count, 10) };
  },

  async updateStatus(
    id: string,
    status: string,
    extra?: { cancellationReason?: string; paymentStatus?: string }
  ): Promise<Order | null> {
    const statusTimestampMap: Record<string, string> = {
      accepted:         'accepted_at',
      preparing:        'preparing_at',
      ready_for_pickup: 'ready_at',
      out_for_delivery: 'picked_up_at',
      delivered:        'delivered_at',
      cancelled:        'cancelled_at',
    };

    const tsCol = statusTimestampMap[status];
    let sql = `UPDATE orders SET status = $1${tsCol ? `, ${tsCol} = NOW()` : ''}`;
    const params: unknown[] = [status];
    let idx = 2;

    if (extra?.cancellationReason) {
      sql += `, cancellation_reason = $${idx++}`;
      params.push(extra.cancellationReason);
    }
    if (extra?.paymentStatus) {
      sql += `, payment_status = $${idx++}`;
      params.push(extra.paymentStatus);
    }

    params.push(id);
    sql += ` WHERE id = $${idx} RETURNING *`;

    const result = await pool.query(sql, params);
    return result.rows[0] ? mapOrder(result.rows[0]) : null;
  },

  async updatePaymentStatus(id: string, paymentStatus: string): Promise<void> {
    await pool.query('UPDATE orders SET payment_status = $1 WHERE id = $2', [paymentStatus, id]);
  },

  async findCouponByCode(code: string): Promise<{
    id: string; discountType: string; discountValue: number;
    minOrderAmount: number; maxDiscount: number | null;
    usageLimit: number | null; usedCount: number; isActive: boolean; expiresAt: Date | null;
  } | null> {
    const result = await pool.query(
      `SELECT id, discount_type, discount_value, min_order_amount, max_discount,
              usage_limit, used_count, is_active, expires_at
       FROM coupons WHERE code = $1`,
      [code.toUpperCase()]
    );
    if (!result.rows[0]) return null;
    const r = result.rows[0];
    return {
      id: r.id,
      discountType: r.discount_type,
      discountValue: parseFloat(r.discount_value),
      minOrderAmount: parseFloat(r.min_order_amount),
      maxDiscount: r.max_discount ? parseFloat(r.max_discount) : null,
      usageLimit: r.usage_limit,
      usedCount: r.used_count,
      isActive: r.is_active,
      expiresAt: r.expires_at,
    };
  },

  async incrementCouponUsage(couponId: string): Promise<void> {
    await pool.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = $1', [couponId]);
  },
};
