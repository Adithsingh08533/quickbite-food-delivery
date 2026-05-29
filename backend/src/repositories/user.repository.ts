import pool from '../database';
import { User, Address } from '../types';

// ─── Row mapping helpers ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapUser = (row: Record<string, any>): User => ({
  id:           row.id,
  name:         row.name,
  email:        row.email,
  passwordHash: row.password_hash,
  phone:        row.phone,
  role:         row.role,
  isVerified:   row.is_verified,
  isBanned:     row.is_banned,
  avatarUrl:    row.avatar_url,
  createdAt:    row.created_at,
  updatedAt:    row.updated_at,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapAddress = (row: Record<string, any>): Address => ({
  id:         row.id,
  userId:     row.user_id,
  label:      row.label,
  flatHouse:  row.flat_house,
  street:     row.street,
  area:       row.area,
  city:       row.city,
  state:      row.state,
  pinCode:    row.pin_code,
  latitude:   row.latitude,
  longitude:  row.longitude,
  isDefault:  row.is_default,
  createdAt:  row.created_at,
  updatedAt:  row.updated_at,
});

// ─── Repository ───────────────────────────────────────────────────────────────

export const userRepository = {
  // ── Create ──────────────────────────────────────────────────────
  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    phone?: string;
    role?: string;
  }): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.name, data.email, data.passwordHash, data.phone ?? null, data.role ?? 'customer']
    );
    return mapUser(result.rows[0]);
  },

  // ── Read ─────────────────────────────────────────────────────────
  async findById(id: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  },

  async findAll(opts: { page: number; limit: number; role?: string }): Promise<{ users: User[]; total: number }> {
    const offset = (opts.page - 1) * opts.limit;
    const params: unknown[] = [opts.limit, offset];
    let where = '';

    if (opts.role) {
      where = 'WHERE role = $3';
      params.push(opts.role);
    }

    const [dataResult, countResult] = await Promise.all([
      pool.query(`SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, params),
      pool.query(`SELECT COUNT(*) FROM users ${where}`, opts.role ? [opts.role] : []),
    ]);

    return {
      users: dataResult.rows.map(mapUser),
      total: parseInt(countResult.rows[0].count, 10),
    };
  },

  // ── Update ───────────────────────────────────────────────────────
  async update(id: string, data: { name?: string; phone?: string; avatarUrl?: string }): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined)      { fields.push(`name = $${idx++}`);       values.push(data.name); }
    if (data.phone !== undefined)     { fields.push(`phone = $${idx++}`);      values.push(data.phone); }
    if (data.avatarUrl !== undefined) { fields.push(`avatar_url = $${idx++}`); values.push(data.avatarUrl); }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  },

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
  },

  async setBanStatus(id: string, isBanned: boolean): Promise<User | null> {
    const result = await pool.query(
      'UPDATE users SET is_banned = $1 WHERE id = $2 RETURNING *',
      [isBanned, id]
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  },

  async setVerified(id: string): Promise<void> {
    await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [id]);
  },

  // ── Refresh Tokens ───────────────────────────────────────────────
  async saveRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [data.userId, data.tokenHash, data.expiresAt]
    );
  },

  async findRefreshToken(tokenHash: string): Promise<{
    id: string; userId: string; expiresAt: Date; isRevoked: boolean;
  } | null> {
    const result = await pool.query(
      `SELECT id, user_id, expires_at, is_revoked
       FROM refresh_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    );
    if (!result.rows[0]) return null;
    return {
      id:         result.rows[0].id,
      userId:     result.rows[0].user_id,
      expiresAt:  result.rows[0].expires_at,
      isRevoked:  result.rows[0].is_revoked,
    };
  },

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await pool.query(
      'UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1',
      [tokenHash]
    );
  },

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await pool.query(
      'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
      [userId]
    );
  },

  // ── Addresses ────────────────────────────────────────────────────
  async createAddress(data: {
    userId: string; label: string; flatHouse: string; street: string;
    area: string; city: string; state: string; pinCode: string; isDefault: boolean;
  }): Promise<Address> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (data.isDefault) {
        await client.query(
          'UPDATE addresses SET is_default = false WHERE user_id = $1',
          [data.userId]
        );
      }

      const result = await client.query(
        `INSERT INTO addresses (user_id, label, flat_house, street, area, city, state, pin_code, is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [data.userId, data.label, data.flatHouse, data.street,
         data.area, data.city, data.state, data.pinCode, data.isDefault]
      );

      await client.query('COMMIT');
      return mapAddress(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async findAddressesByUser(userId: string): Promise<Address[]> {
    const result = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return result.rows.map(mapAddress);
  },

  async findAddressById(id: string, userId: string): Promise<Address | null> {
    const result = await pool.query(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0] ? mapAddress(result.rows[0]) : null;
  },

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  },
};
