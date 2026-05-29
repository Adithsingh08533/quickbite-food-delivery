import { Response } from 'express';

// ─── Response Shape Interfaces ────────────────────────────────────────────────

interface SuccessBody<T> {
  success: true;
  data: T;
  message: string;
}

interface ErrorBody {
  success: false;
  error: string;
  statusCode: number;
}

interface PaginatedBody<T> {
  success: true;
  data: T[];
  message: string;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Response Helpers ─────────────────────────────────────────────────────────

/**
 * Standard success response.
 * Shape: { success: true, data: T, message: string }
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response => {
  const body: SuccessBody<T> = { success: true, data, message };
  return res.status(statusCode).json(body);
};

/**
 * Created response (201).
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message = 'Created successfully'
): Response => sendSuccess(res, data, message, 201);

/**
 * Standard error response.
 * Shape: { success: false, error: string, statusCode: number }
 */
export const sendError = (
  res: Response,
  error: string,
  statusCode = 500
): Response => {
  const body: ErrorBody = { success: false, error, statusCode };
  return res.status(statusCode).json(body);
};

/**
 * Paginated list response.
 * Shape: { success: true, data: T[], message: string, pagination: {...} }
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
): Response => {
  const body: PaginatedBody<T> = {
    success: true,
    data,
    message,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
  return res.status(200).json(body);
};
