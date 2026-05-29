import { Request, Response, NextFunction } from 'express';

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Wraps async route handlers to catch rejected promises and forward them
 * to Express's next(err) — eliminating try/catch boilerplate in controllers.
 *
 * Usage:
 *   router.get('/path', asyncHandler(myController.action));
 */
export const asyncHandler =
  (fn: AsyncRouteHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
