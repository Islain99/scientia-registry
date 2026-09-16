import { api, tokenStore } from './apiClient';

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: string;
  favorites: string[];
  created_at: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// ── Auth service ──────────────────────────────────────────────────────────────

export const authService = {
  /** Login with email/password — stores tokens and returns the current user. */
  async login(email: string, password: string): Promise<UserPublic> {
    const res = await api.post<TokenResponse>('/auth/login', { email, password });
    tokenStore.setAccess(res.access_token);
    tokenStore.setRefresh(res.refresh_token);
    return api.get<UserPublic>('/auth/me');
  },

  /** Register a new account — does NOT log in automatically. */
  async register(name: string, email: string, password: string): Promise<UserPublic> {
    return api.post<UserPublic>('/auth/register', { name, email, password });
  },

  /** Returns the current user if a valid token exists, otherwise null. */
  async me(): Promise<UserPublic | null> {
    if (!tokenStore.getAccess()) return null;
    try {
      return await api.get<UserPublic>('/auth/me');
    } catch {
      return null;
    }
  },

  /** Clear tokens and log out. */
  logout(): void {
    tokenStore.clear();
  },

  /** Quick synchronous check — token presence only, does NOT verify with the server. */
  isAuthenticated(): boolean {
    return !!tokenStore.getAccess();
  },
};
