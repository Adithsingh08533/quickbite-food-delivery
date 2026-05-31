/**
 * QuickBite – Environment Configuration
 *
 * SINGLE SOURCE OF TRUTH for all environment variables.
 * Validates all required variables at startup — the server will NOT start
 * if any required variable is missing. This prevents silent runtime failures
 * from misconfigured deployments.
 *
 * Usage: import config from './config/config';
 *        config.jwt.secret  ← always typed and validated
 */

import dotenv from 'dotenv';
import path from 'path';

// Load the correct .env file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : process.env.NODE_ENV === 'test'
  ? '.env.test'
  : '.env.development';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });
// Also load .env as fallback
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ─────────────────────────────────────────────────────────────────────────────
// Helper: require a variable or throw a clear startup error
// ─────────────────────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Config] Missing required environment variable: ${key}\n` +
      `  → Copy .env.example to .env.development and fill in the value.`
    );
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function requireEnvInt(key: string, fallback?: number): number {
  const raw = process.env[key];
  if (!raw) {
    if (fallback !== undefined) return fallback;
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new Error(`[Config] Environment variable ${key} must be an integer, got: "${raw}"`);
  }
  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Config object — typed, validated, immutable
// ─────────────────────────────────────────────────────────────────────────────

const config = {
  nodeEnv: optionalEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  isDev:   optionalEnv('NODE_ENV', 'development') === 'development',
  isProd:  optionalEnv('NODE_ENV', 'development') === 'production',
  isTest:  optionalEnv('NODE_ENV', 'development') === 'test',

  server: {
    port:       requireEnvInt('PORT', 5000),
    corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
  },

  database: {
    url:      process.env['DATABASE_URL'] ?? '',   // Neon provides this in prod
    host:     optionalEnv('DB_HOST', 'localhost'),
    port:     requireEnvInt('DB_PORT', 5432),
    name:     optionalEnv('DB_NAME', 'quickbite'),
    user:     optionalEnv('DB_USER', 'postgres'),
    password: optionalEnv('DB_PASSWORD', ''),
  },

  jwt: {
    secret:             requireEnv('JWT_SECRET'),
    refreshSecret:      requireEnv('JWT_REFRESH_SECRET'),
    expiresIn:          optionalEnv('JWT_EXPIRES_IN', '15m'),
    refreshExpiresIn:   optionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  cloudinary: {
    cloudName:  requireEnv('CLOUDINARY_CLOUD_NAME'),
    apiKey:     requireEnv('CLOUDINARY_API_KEY'),
    apiSecret:  requireEnv('CLOUDINARY_API_SECRET'),
  },

  razorpay: {
    keyId:     requireEnv('RAZORPAY_KEY_ID'),
    keySecret: requireEnv('RAZORPAY_KEY_SECRET'),
  },

  email: {
    host:   optionalEnv('SMTP_HOST', 'smtp.gmail.com'),
    port:   requireEnvInt('SMTP_PORT', 587),
    user:   requireEnv('SMTP_USER'),
    pass:   requireEnv('SMTP_PASS'),
    from:   optionalEnv('EMAIL_FROM', 'QuickBite <noreply@quickbite.in>'),
  },
} as const;

export type Config = typeof config;
export default config;
