import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'owner' | 'admin';
  avatarUrl?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

/**
 * SECURITY NOTE — Access Token Storage
 * ──────────────────────────────────────────────────────────────────────────────
 * The access token is stored in localStorage via Zustand persist so it survives
 * page reloads. This is a known XSS risk: any malicious script injected into the
 * page (e.g. via a compromised npm package or stored XSS) can read localStorage
 * and steal the access token.
 *
 * The refresh token is in an httpOnly cookie and cannot be stolen this way. ✅
 *
 * MITIGATION IN PLACE: The access token is short-lived (15 min). Even if stolen,
 * the attacker's window is limited.
 *
 * FUTURE IMPROVEMENT: Replace localStorage with in-memory state. On page load,
 * call GET /auth/me (with the httpOnly refresh token cookie) to restore the
 * session and get a new access token without touching localStorage at all.
 * This eliminates the XSS attack surface entirely.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken) => {
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        set({ user, accessToken, isAuthenticated: true });
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await api.post('/auth/logout');
        } catch {
          // Ignore errors during logout (e.g., token already invalid)
        } finally {
          delete api.defaults.headers.common['Authorization'];
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
    }),
    {
      name: 'auth-storage', // unique name
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated 
      }), // only persist user, token, and auth status, not loading state
    }
  )
);
