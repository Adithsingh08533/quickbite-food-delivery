import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

/**
 * Global error handler — must be the LAST middleware registered in app.ts.
 *
 * Handles:
 *  - AppError (operational errors) → send statusCode + message to client
 *  - ZodError (validation) → 422 with field details
 *  - PostgreSQL errors → mapped to appropriate HTTP status
 *  - Unknown errors → 500 (never expose internals in production)
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // ── AppError (operational) ───────────────────────────────────────
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Operational server error', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
    }

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // ── Zod validation error ─────────────────────────────────────────
  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(422).json({
      success: false,
      error: 'Validation failed',
      statusCode: 422,
      details,
    });
    return;
  }

  // ── PostgreSQL errors ────────────────────────────────────────────
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const pgError = err as { code: string; detail?: string; constraint?: string };

    // Unique constraint violation
    if (pgError.code === '23505') {
      const field = pgError.detail?.match(/Key \((.+?)\)/)?.[1] ?? 'field';
      res.status(409).json({
        success: false,
        error: `A record with this ${field} already exists`,
        statusCode: 409,
      });
      return;
    }

    // Foreign key violation
    if (pgError.code === '23503') {
      res.status(400).json({
        success: false,
        error: 'Referenced resource does not exist',
        statusCode: 400,
      });
      return;
    }
  }

  // ── Unknown / programming errors ────────────────────────────────
  logger.error('Unhandled error', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  const message =
    process.env['NODE_ENV'] === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err instanceof Error
      ? err.message
      : String(err);

  res.status(500).json({
    success: false,
    error: message,
    statusCode: 500,
  });
};
