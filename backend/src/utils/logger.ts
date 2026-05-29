/**
 * QuickBite – Winston Logger
 * Structured JSON logging for production, pretty-printed for development.
 * Usage: import logger from '../utils/logger';
 *        logger.info('Server started', { port: 5000 });
 *        logger.error('Database error', { error: err.message });
 */

import winston from 'winston';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const isDev = process.env['NODE_ENV'] !== 'production';

// Pretty format for development terminal
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0
      ? `\n  ${JSON.stringify(meta, null, 2)}`
      : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${ts} [${level}] ${message}${metaStr}${stackStr}`;
  })
);

// Structured JSON for production (parsed by log aggregators like Datadog, Logtail)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: isDev ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console(),
    // In production, add file transport or external service
    ...(!isDev ? [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
    ] : []),
  ],
  // Prevent process exit on uncaught exceptions — let the app handle it
  exitOnError: false,
});

export default logger;
