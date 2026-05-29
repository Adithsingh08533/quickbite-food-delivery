import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidateTarget = 'body' | 'params' | 'query';

/**
 * Validates the specified request part against a Zod schema.
 * On validation failure, responds with 422 and a detailed error message.
 *
 * Usage:
 *   router.post('/register', validate('body', registerSchema), authController.register)
 */
export const validate =
  (target: ValidateTarget, schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = (result.error as ZodError).errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      res.status(422).json({
        success: false,
        error: 'Validation failed',
        statusCode: 422,
        details: errors,
      });
      return;
    }

    // Replace with parsed (and possibly transformed/coerced) data
    req[target] = result.data;
    next();
  };
