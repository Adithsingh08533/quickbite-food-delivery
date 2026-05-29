import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

/**
 * Verifies the Bearer token in the Authorization header.
 * On success, attaches { userId, role } to req.user.
 * On failure, throws AppError(401).
 */
export const authenticateJWT = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No authentication token provided', 401));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError('Malformed authorization header', 401));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional authentication — attaches req.user if token is present,
 * but does NOT throw if missing. Used for public routes that optionally
 * show personalized content when logged in.
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No token → continue as unauthenticated
  }

  const token = authHeader.split(' ')[1];
  if (!token) return next();

  try {
    req.user = verifyAccessToken(token);
  } catch {
    // Invalid token on optional auth → just ignore it
  }

  next();
};
