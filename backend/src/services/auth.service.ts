import bcrypt from 'bcrypt';
import config from '../config/config';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../utils/AppError';
import { signAccessToken } from '../utils/jwt';
import { generateRawToken, hashToken } from '../utils/hashToken';
import { User, PublicUser, AuthTokens } from '../types';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 64;

function toPublicUser(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _ph, ...pub } = user;
  return pub as PublicUser;
}

export const authService = {
  async register(data: {
    name: string; email: string; password: string; phone?: string; role?: string;
  }): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    // Check duplicate email
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError('An account with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone,
      role: data.role ?? 'customer',
    });

    const tokens = await authService._issueTokens(user.id, user.role);
    return { user: toPublicUser(user), tokens };
  },

  async login(data: { email: string; password: string }): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      // Use consistent error to prevent email enumeration
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isBanned) {
      throw new AppError('Your account has been suspended. Please contact support.', 403);
    }

    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = await authService._issueTokens(user.id, user.role);
    return { user: toPublicUser(user), tokens };
  },

  async refreshTokens(rawRefreshToken: string): Promise<{ accessToken: string }> {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await userRepository.findRefreshToken(tokenHash);

    if (!stored) {
      throw new AppError('Invalid refresh token', 401);
    }
    if (stored.isRevoked) {
      // Possible token reuse attack — revoke all tokens for this user
      await userRepository.revokeAllRefreshTokens(stored.userId);
      throw new AppError('Refresh token reuse detected. Please login again.', 401);
    }
    if (stored.expiresAt < new Date()) {
      throw new AppError('Refresh token expired. Please login again.', 401);
    }

    const user = await userRepository.findById(stored.userId);
    if (!user || user.isBanned) {
      throw new AppError('User account is not accessible', 401);
    }

    // Rotate: revoke old, issue new
    await userRepository.revokeRefreshToken(tokenHash);
    const newRaw = generateRawToken(REFRESH_TOKEN_BYTES);
    const newHash = hashToken(newRaw);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await userRepository.saveRefreshToken({ userId: user.id, tokenHash: newHash, expiresAt });

    const accessToken = signAccessToken({ userId: user.id, role: user.role });

    return { accessToken };
  },

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await userRepository.revokeRefreshToken(tokenHash);
  },

  // ── Internal: issue both tokens ────────────────────────────────
  async _issueTokens(userId: string, role: string): Promise<AuthTokens> {
    const accessToken = signAccessToken({ userId, role: role as import('../types').UserRole });

    const rawRefreshToken = generateRawToken(REFRESH_TOKEN_BYTES);
    const tokenHash = hashToken(rawRefreshToken);
    const expiresIn = config.jwt.refreshExpiresIn;
    const days = parseInt(expiresIn.replace('d', ''), 10) || 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await userRepository.saveRefreshToken({ userId, tokenHash, expiresAt });

    return { accessToken, refreshToken: rawRefreshToken };
  },
};
