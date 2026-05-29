import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import config from '../config/config';
import { AppError } from './AppError';
import { UserRole } from '../types';

// ─── Payload shape inside every access token ──────────────────────────────────

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
}

// ─── Sign ─────────────────────────────────────────────────────────────────────

export const signAccessToken = (payload: AccessTokenPayload): string => {
  const options: SignOptions = { expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, config.jwt.secret, options);
};

// ─── Verify ───────────────────────────────────────────────────────────────────

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload & AccessTokenPayload;
    return { userId: decoded.userId, role: decoded.role };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Access token expired', 401);
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid access token', 401);
    }
    throw new AppError('Token verification failed', 401);
  }
};
