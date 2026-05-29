import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { UserRole } from '../types';

/**
 * RBAC Role Guard — must be used AFTER authenticateJWT.
 * Accepts one or more allowed roles.
 *
 * Usage:
 *   router.post('/restaurants', authenticateJWT, authorizeRole('owner', 'admin'), handler)
 */
export const authorizeRole = (...allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`,
          403
        )
      );
    }

    next();
  };
