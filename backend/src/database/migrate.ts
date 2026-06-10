/**
 * QuickBite – Database Migration Runner
 * Reads and executes all SQL migration files in order.
 * Usage: npm run migrate
 */

import fs from 'fs';
import path from 'path';
import pool from './index';
import logger from '../utils/logger';

async function migrate(): Promise<void> {
  const client = await pool.connect();
  let migrationsDir = path.join(__dirname, 'migrations');
  
  // If running from dist/database, the migrations folder (containing .sql files) 
  // won't be copied by tsc, so we fall back to the src directory.
  if (!fs.existsSync(migrationsDir)) {
    migrationsDir = path.join(__dirname, '../../src/database/migrations');
  }

  // Create migrations tracking table if it doesn't exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          SERIAL PRIMARY KEY,
      filename    VARCHAR(255) NOT NULL UNIQUE,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Get list of already-applied migrations
  const result = await client.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations ORDER BY id'
  );
  const applied = new Set(result.rows.map(r => r.filename));

  // Read all .sql files in migrations directory, sorted alphabetically
  const files = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  let ran = 0;

  for (const file of files) {
    if (applied.has(file)) {
      logger.debug(`Skipping already-applied migration: ${file}`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    logger.info(`Applying migration: ${file}`);

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
      logger.info(`✅ Applied: ${file}`);
      ran++;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error(`❌ Failed to apply migration: ${file}`, { error: (err as Error).message });
      throw err;
    }
  }

  client.release();

  if (ran === 0) {
    logger.info('Database is up to date — no new migrations.');
  } else {
    logger.info(`Migration complete. Applied ${ran} new migration(s).`);
  }

  await pool.end();
}

migrate().catch(err => {
  logger.error('Migration failed', { error: err.message });
  process.exit(1);
});
