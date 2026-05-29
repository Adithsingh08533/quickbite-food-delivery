/**
 * QuickBite – HTTP Server Entry Point
 *
 * Validates config, connects to DB, then starts the HTTP server.
 * Socket.IO will be attached here in Phase 5.
 */

import app from './app';
import config from './config/config';
import { connectDB } from './database';
import logger from './utils/logger';

const startServer = async (): Promise<void> => {
  try {
    // ── 1. Validate all required environment variables ──────────────
    // config.ts throws on startup if any required var is missing
    logger.info(`Starting QuickBite API (${config.nodeEnv})...`);

    // ── 2. Connect to PostgreSQL ─────────────────────────────────────
    await connectDB();

    // ── 3. Start HTTP Server ─────────────────────────────────────────
    const server = app.listen(config.server.port, () => {
      logger.info(`✅ Server running on port ${config.server.port}`);
      logger.info(`   Health:  http://localhost:${config.server.port}/health`);

      if (config.isDev) {
        logger.info(`   Swagger: http://localhost:${config.server.port}/api/docs`);
      }
    });

    // ── 4. Graceful Shutdown ──────────────────────────────────────────
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);

      server.close(() => {
        logger.info('HTTP server closed. Goodbye!');
        process.exit(0);
      });

      // Force shutdown after 10 seconds if connections won't close
      setTimeout(() => {
        logger.error('Forced shutdown after 10s timeout');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('Failed to start server', {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
};

// ── Handle uncaught promise rejections ────────────────────────────────────────
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

startServer();
