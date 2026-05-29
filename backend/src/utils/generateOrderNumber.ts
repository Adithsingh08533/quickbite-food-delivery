import pool from '../database';
import { AppError } from './AppError';

// Counter padded to 6 digits, resets per day (date-scoped uniqueness via DB serial)
// Format: QB-YYYYMMDD-XXXXXX
// Example: QB-20240115-000042

export const generateOrderNumber = async (): Promise<string> => {
  // Use a DB sequence scoped to date for collision-safe generation
  const result = await pool.query<{ order_number: string }>(
    `INSERT INTO order_number_seq DEFAULT VALUES RETURNING order_number`
  );
  // Fallback: use timestamp + random if sequence table not present
  if (!result.rows[0]) {
    throw new AppError('Failed to generate order number', 500);
  }
  return result.rows[0].order_number;
};

/**
 * Simpler version that uses a timestamp + random suffix.
 * Used as fallback and in the seed script.
 * Format: QB-{YYYYMMDD}-{6 random hex chars}
 */
export const generateOrderNumberFallback = (): string => {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `QB-${date}-${random}`;
};
