import pool from '../database';

export const notificationRepository = {
  async create(data: {
    userId: string; type: string; title: string; body: string; data?: Record<string, unknown>;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1,$2,$3,$4,$5)`,
      [data.userId, data.type, data.title, data.body, data.data ? JSON.stringify(data.data) : null]
    );
  },

  async findByUser(userId: string, opts: { page: number; limit: number }): Promise<{
    notifications: Array<{
      id: string; type: string; title: string; body: string;
      data: Record<string, unknown> | null; isRead: boolean; createdAt: Date;
    }>;
    total: number;
    unreadCount: number;
  }> {
    const offset = (opts.page - 1) * opts.limit;

    const [dataRes, countRes, unreadRes] = await Promise.all([
      pool.query(
        `SELECT * FROM notifications WHERE user_id = $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [userId, opts.limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1', [userId]),
      pool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      ),
    ]);

    return {
      notifications: dataRes.rows.map(r => ({
        id:        r.id,
        type:      r.type,
        title:     r.title,
        body:      r.body,
        data:      r.data,
        isRead:    r.is_read,
        createdAt: r.created_at,
      })),
      total:       parseInt(countRes.rows[0].count, 10),
      unreadCount: parseInt(unreadRes.rows[0].count, 10),
    };
  },

  async markAllRead(userId: string): Promise<void> {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
  },

  async markOneRead(id: string, userId: string): Promise<void> {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  },
};
