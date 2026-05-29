// Augment Express Request to include the authenticated user
// This file is auto-loaded by TypeScript due to typeRoots config.

import { UserRole } from './user.types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

export {};
