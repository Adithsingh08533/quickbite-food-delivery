import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { emailService } from '../services/email.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import config from '../config/config';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly:  true,
  secure:    config.isProd,
  sameSite:  'strict' as const,
  maxAge:    7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path:      '/api/v1/auth',
};

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.register(req.body);

    // Welcome email — fire-and-forget (non-blocking)
    emailService.sendWelcomeEmail(user.email, user.name);

    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

    sendCreated(res, { user, accessToken: tokens.accessToken }, 'Account created successfully');
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { user, tokens } = await authService.login(req.body);

    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

    sendSuccess(res, { user, accessToken: tokens.accessToken }, 'Login successful');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const rawRefreshToken = req.cookies?.refreshToken as string | undefined;

    if (!rawRefreshToken) {
      throw new AppError('No refresh token provided', 401);
    }

    const { accessToken } = await authService.refreshTokens(rawRefreshToken);

    sendSuccess(res, { accessToken }, 'Token refreshed');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const rawRefreshToken = req.cookies?.refreshToken as string | undefined;

    if (rawRefreshToken) {
      await authService.logout(rawRefreshToken);
    }

    res.clearCookie('refreshToken', { path: '/api/v1/auth' });

    sendSuccess(res, null, 'Logged out successfully');
  }),
};
