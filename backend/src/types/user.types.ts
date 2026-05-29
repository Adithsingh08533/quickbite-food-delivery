export type UserRole = 'customer' | 'owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  role: UserRole;
  isVerified: boolean;
  isBanned: boolean;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Shape returned to client — no password */
export type PublicUser = Omit<User, 'passwordHash'>;

export interface Address {
  id: string;
  userId: string;
  label: string;
  flatHouse: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pinCode: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── DTOs ───────────────────────────────────────────────────────────

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateAddressDto {
  label?: string;
  flatHouse: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault?: boolean;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}
