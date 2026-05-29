import rateLimit, { Options } from 'express-rate-limit';
import { Request, Response } from 'express';

const make429Handler = () => (_req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    error: 'Too many requests. Please try again later.',
    statusCode: 429,
  });
};

const baseOpts = (max: number, windowMs: number): Partial<Options> => ({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: make429Handler(),
});

/**
 * Strict limiter for auth endpoints — prevents brute-force attacks.
 * 5 requests per 15 minutes per IP.
 */
export const authRateLimiter = rateLimit(baseOpts(5, 15 * 60 * 1000));

/**
 * General API rate limiter — prevents abuse on regular endpoints.
 * 100 requests per minute per IP.
 */
export const apiRateLimiter = rateLimit(baseOpts(100, 60 * 1000));

/**
 * Upload rate limiter — prevents abuse on file upload endpoints.
 * 10 uploads per minute per IP.
 */
export const uploadRateLimiter = rateLimit(baseOpts(10, 60 * 1000));
