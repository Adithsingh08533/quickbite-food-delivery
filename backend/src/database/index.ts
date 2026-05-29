/**
 * QuickBite – Database Connection Pool
 * Uses node-postgres (pg) Pool for connection management.
 * Import this pool in repositories — never create new Pool instances elsewhere.
 */

import { Pool, PoolConfig } from 'pg';
import config from '../config/config';
import logger from '../utils/logger';

const poolConfig: PoolConfig = {
  connectionString: config.database.url,
  host:             config.database.host,
  port:             config.database.port,
  database:         config.database.name,
  user:             config.database.user,
  password:         config.database.password,
  max:              20,          // max connections in pool
  idleTimeoutMillis: 30_000,    // close idle clients after 30 seconds
  connectionTimeoutMillis: 5_000, // throw if no connection within 5 seconds
  ssl: config.nodeEnv === 'production'
    ? { rejectUnauthorized: false }  // Neon PostgreSQL requires SSL in prod
    : false,
};

// DATABASE_URL takes precedence over individual fields (Neon provides DATABASE_URL)
const pool = config.database.url
  ? new Pool({ connectionString: config.database.url, ssl: poolConfig.ssl, max: 20 })
  : new Pool(poolConfig);

// Log pool-level errors (unhandled client errors)
pool.on('error', (err: Error) => {
  logger.error('Unexpected database pool error', { error: err.message });
  process.exit(1);
});

// Test connection on startup
export const connectDB = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT version()');
    logger.info('PostgreSQL connected', {
      version: result.rows[0].version.split(' ').slice(0, 2).join(' '),
    });
  } finally {
    client.release();
  }
};

export default pool;
