import crypto from 'crypto';

/**
 * One-way SHA-256 hash of any token string.
 * Used to store refresh tokens in DB without exposing raw values.
 */
export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

/**
 * Generate a cryptographically secure random token (hex-encoded).
 * Default 64 bytes → 128 character hex string.
 */
export const generateRawToken = (bytes = 64): string =>
  crypto.randomBytes(bytes).toString('hex');
