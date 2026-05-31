import pool from '../database';
import { Restaurant, FoodCategory } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRestaurant = (row: Record<string, any>): Restaurant => ({
  id:               row.id,
  ownerId:          row.owner_id,
  name:             row.name,
  description:      row.description,
  cuisineType:      row.cuisine_type,
  phone:            row.phone,
  address:          row.address,
  city:             row.city,
  state:            row.state,
  pinCode:          row.pin_code,
  imageUrl:         row.image_url,
  avgRating:        parseFloat(row.avg_rating),
  reviewCount:      row.review_count,
  deliveryFee:      parseFloat(row.delivery_fee),
  minOrderAmount:   parseFloat(row.min_order_amount),
  deliveryTimeMin:  row.delivery_time_min,
  isOpen:           row.is_open,
  approvalStatus:   row.approval_status,
  rejectionReason:  row.rejection_reason,
  gstin:            row.gstin,
  fssaiNumber:      row.fssai_number,
  createdAt:        row.created_at,
  updatedAt:        row.updated_at,
  latitude:         row.latitude ? parseFloat(row.latitude) : null,
  longitude:        row.longitude ? parseFloat(row.longitude) : null,
  distance:         row.distance ? parseFloat(row.distance) : undefined,
  ownerName:        row.owner_name,
  ownerEmail:       row.owner_email,
  ownerPhone:       row.owner_phone,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapCategory = (row: Record<string, any>): FoodCategory => ({
  id:           row.id,
  restaurantId: row.restaurant_id,
  name:         row.name,
  description:  row.description,
  displayOrder: row.display_order,
  createdAt:    row.created_at,
  updatedAt:    row.updated_at,
});

export const restaurantRepository = {
  // ── Create ──────────────────────────────────────────────────────
  async create(data: {
    ownerId: string; name: string; description?: string; cuisineType: string;
    phone: string; address: string; city: string; state: string; pinCode: string;
    deliveryFee: number; minOrderAmount: number; deliveryTimeMin: number;
    gstin?: string; fssaiNumber?: string; latitude?: number; longitude?: number;
  }): Promise<Restaurant> {
    const result = await pool.query(
      `INSERT INTO restaurants
         (owner_id, name, description, cuisine_type, phone, address, city, state, pin_code,
          delivery_fee, min_order_amount, delivery_time_min, gstin, fssai_number, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        data.ownerId, data.name, data.description ?? null, data.cuisineType,
        data.phone, data.address, data.city, data.state, data.pinCode,
        data.deliveryFee, data.minOrderAmount, data.deliveryTimeMin,
        data.gstin ?? null, data.fssaiNumber ?? null, data.latitude ?? null, data.longitude ?? null,
      ]
    );
    return mapRestaurant(result.rows[0]);
  },

  // ── Read (public — approved only) ───────────────────────────────
  async findAllApproved(opts: {
    city?: string; cuisineType?: string; search?: string;
    isOpen?: boolean; sortBy?: string; page: number; limit: number;
  }): Promise<{ restaurants: Restaurant[]; total: number }> {
    const params: unknown[] = [];
    const conditions: string[] = ["r.approval_status = 'approved'"];
    let idx = 1;

    if (opts.city) {
      conditions.push(`r.city ILIKE $${idx++}`);
      params.push(`%${opts.city}%`);
    }
    if (opts.cuisineType) {
      conditions.push(`r.cuisine_type ILIKE $${idx++}`);
      params.push(`%${opts.cuisineType}%`);
    }
    if (opts.search) {
      conditions.push(`(r.name ILIKE $${idx} OR r.cuisine_type ILIKE $${idx})`);
      params.push(`%${opts.search}%`);
      idx++;
    }
    if (opts.isOpen !== undefined) {
      conditions.push(`r.is_open = $${idx++}`);
      params.push(opts.isOpen);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const sortMap: Record<string, string> = {
      rating:       'r.avg_rating DESC',
      deliveryTime: 'r.delivery_time_min ASC',
      deliveryFee:  'r.delivery_fee ASC',
    };
    const orderBy = sortMap[opts.sortBy ?? ''] ?? 'r.avg_rating DESC';

    const offset = (opts.page - 1) * opts.limit;
    params.push(opts.limit, offset);

    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT r.* FROM restaurants r ${whereClause} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx}`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) FROM restaurants r ${whereClause}`,
        params.slice(0, params.length - 2)
      ),
    ]);

    return {
      restaurants: dataRes.rows.map(mapRestaurant),
      total: parseInt(countRes.rows[0].count, 10),
    };
  },

  async findNearby(opts: {
    lat: number; lng: number; radius: number;
    city?: string; cuisineType?: string; search?: string;
    isOpen?: boolean; sortBy?: string; page: number; limit: number;
  }): Promise<{ restaurants: Restaurant[]; total: number }> {
    const params: unknown[] = [opts.lat, opts.lng, opts.radius];
    let idx = 4;
    
    // Haversine formula for distance in km
    const distanceSql = `(6371 * acos(cos(radians($1)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians($2)) + sin(radians($1)) * sin(radians(r.latitude))))`;
    
    const conditions: string[] = [
      `r.approval_status = 'approved'`,
      `r.latitude IS NOT NULL`,
      `r.longitude IS NOT NULL`,
      `${distanceSql} <= $3`
    ];

    if (opts.city) {
      conditions.push(`r.city ILIKE $${idx++}`);
      params.push(`%${opts.city}%`);
    }
    if (opts.cuisineType) {
      conditions.push(`r.cuisine_type ILIKE $${idx++}`);
      params.push(`%${opts.cuisineType}%`);
    }
    if (opts.search) {
      conditions.push(`(r.name ILIKE $${idx} OR r.cuisine_type ILIKE $${idx})`);
      params.push(`%${opts.search}%`);
      idx++;
    }
    if (opts.isOpen !== undefined) {
      conditions.push(`r.is_open = $${idx++}`);
      params.push(opts.isOpen);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const sortMap: Record<string, string> = {
      rating:       'r.avg_rating DESC',
      deliveryTime: 'r.delivery_time_min ASC',
      deliveryFee:  'r.delivery_fee ASC',
      distance:     'distance ASC',
    };
    const orderBy = sortMap[opts.sortBy ?? 'distance'] ?? 'distance ASC';

    const offset = (opts.page - 1) * opts.limit;
    params.push(opts.limit, offset);

    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT r.*, ${distanceSql} AS distance FROM restaurants r ${whereClause} ORDER BY ${orderBy} LIMIT $${idx++} OFFSET $${idx}`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) FROM restaurants r ${whereClause}`,
        params.slice(0, params.length - 2)
      ),
    ]);

    return {
      restaurants: dataRes.rows.map(mapRestaurant),
      total: parseInt(countRes.rows[0].count, 10),
    };
  },

  async findById(id: string): Promise<Restaurant | null> {
    const result = await pool.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    return result.rows[0] ? mapRestaurant(result.rows[0]) : null;
  },

  async findByOwnerId(ownerId: string): Promise<Restaurant[]> {
    const result = await pool.query(
      'SELECT * FROM restaurants WHERE owner_id = $1 ORDER BY created_at DESC',
      [ownerId]
    );
    return result.rows.map(mapRestaurant);
  },

  async findAllForAdmin(opts: {
    approvalStatus?: string; page: number; limit: number;
  }): Promise<{ restaurants: Restaurant[]; total: number }> {
    const params: unknown[] = [];
    let where = '';

    if (opts.approvalStatus) {
      where = 'WHERE approval_status = $1';
      params.push(opts.approvalStatus);
    }

    const offset = (opts.page - 1) * opts.limit;
    params.push(opts.limit, offset);
    const li = params.length - 1;

    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT r.*, u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone
         FROM restaurants r
         JOIN users u ON u.id = r.owner_id
         ${where} ORDER BY r.created_at DESC LIMIT $${li} OFFSET $${li + 1}`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) FROM restaurants ${where}`,
        opts.approvalStatus ? [opts.approvalStatus] : []
      ),
    ]);

    return {
      restaurants: dataRes.rows.map(mapRestaurant),
      total: parseInt(countRes.rows[0].count, 10),
    };
  },

  // ── Update ───────────────────────────────────────────────────────
  async update(id: string, data: Partial<{
    name: string; description: string; cuisineType: string; phone: string;
    address: string; city: string; state: string; pinCode: string; imageUrl: string;
    deliveryFee: number; minOrderAmount: number; deliveryTimeMin: number;
    isOpen: boolean; gstin: string; fssaiNumber: string;
    latitude: number; longitude: number;
  }>): Promise<Restaurant | null> {
    const fieldMap: Record<string, string> = {
      name: 'name', description: 'description', cuisineType: 'cuisine_type',
      phone: 'phone', address: 'address', city: 'city', state: 'state',
      pinCode: 'pin_code', imageUrl: 'image_url', deliveryFee: 'delivery_fee',
      minOrderAmount: 'min_order_amount', deliveryTimeMin: 'delivery_time_min',
      isOpen: 'is_open', gstin: 'gstin', fssaiNumber: 'fssai_number',
      latitude: 'latitude', longitude: 'longitude'
    };

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in data && data[key as keyof typeof data] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(data[key as keyof typeof data]);
      }
    }

    if (fields.length === 0) return null;
    values.push(id);

    const result = await pool.query(
      `UPDATE restaurants SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] ? mapRestaurant(result.rows[0]) : null;
  },

  async setApprovalStatus(
    id: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ): Promise<Restaurant | null> {
    const result = await pool.query(
      `UPDATE restaurants SET approval_status = $1, rejection_reason = $2 WHERE id = $3 RETURNING *`,
      [status, rejectionReason ?? null, id]
    );
    return result.rows[0] ? mapRestaurant(result.rows[0]) : null;
  },

  async updateAvgRating(restaurantId: string): Promise<void> {
    await pool.query(
      `UPDATE restaurants
       SET avg_rating = COALESCE((
         SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE restaurant_id = $1
       ), 0),
       review_count = (SELECT COUNT(*) FROM reviews WHERE restaurant_id = $1)
       WHERE id = $1`,
      [restaurantId]
    );
  },

  // ── Categories ───────────────────────────────────────────────────
  async createCategory(data: {
    restaurantId: string; name: string; description?: string; displayOrder: number;
  }): Promise<FoodCategory> {
    const result = await pool.query(
      `INSERT INTO food_categories (restaurant_id, name, description, display_order)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [data.restaurantId, data.name, data.description ?? null, data.displayOrder]
    );
    return mapCategory(result.rows[0]);
  },

  async findCategoriesByRestaurant(restaurantId: string): Promise<FoodCategory[]> {
    const result = await pool.query(
      'SELECT * FROM food_categories WHERE restaurant_id = $1 ORDER BY display_order',
      [restaurantId]
    );
    return result.rows.map(mapCategory);
  },

  async deleteCategory(id: string, restaurantId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM food_categories WHERE id = $1 AND restaurant_id = $2',
      [id, restaurantId]
    );
    return (result.rowCount ?? 0) > 0;
  },
};
