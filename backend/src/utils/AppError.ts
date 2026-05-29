/**
 * QuickBite – Custom Application Error
 *
 * All intentional, operational errors (4xx/5xx) should throw AppError.
 * The global error handler distinguishes AppError (operational) from
 * unexpected errors (programming bugs) to format the response correctly.
 *
 * Usage:
 *   throw new AppError('Restaurant not found', 404);
 *   throw new AppError('Unauthorized', 401);
 */
export class AppError extends Error {
  public readonly statusCode: number;
  /** isOperational = true means "we expected this error, it is safe to send to client" */
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Restore prototype chain (required when extending built-in classes in TS)
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
