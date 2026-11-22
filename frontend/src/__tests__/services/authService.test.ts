/**
 * Tests unitaires pour services/authService.ts
 *
 * Stratégie :
 *  - On mocke le module 'services/apiClient' pour contrôler request() et tokenStore
 *  - Les tests vérifient le comportement de haut niveau (login, register, me, logout)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Types de base reproduisant la forme publique ───────────────────────────
interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: string;
  favorites: string[];
  created_at: number;
}

// ── Mock du module apiClient AVANT l'import d'authService ─────────────────
const mockRequest = vi.fn();
const mockTokenStore = {
  getAccess: vi.fn(),
  getRefresh: vi.fn(),
  setAccess: vi.fn(),
  setRefresh: vi.fn(),
  clear: vi.fn(),
};

vi.mock('../../services/apiClient', () => ({
  request: mockRequest,
  tokenStore: mockTokenStore,
}));

// Import après le mock
import * as authService from '../../services/authService';

const FAKE_USER: UserPublic = {
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  role: 'student',
  favorites: [],
  created_at: 1700000000,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════
// login()
// ══════════════════════════════════════════════════════════════════════════

describe('authService.login()', () => {
  it('stocke les tokens et retourne l\'utilisateur', async () => {
    mockRequest
      .mockResolvedValueOnce({ access_token: 'acc', refresh_token: 'ref' })
      .mockResolvedValueOnce(FAKE_USER);

    const user = await authService.login('alice@example.com', 'password123');

    expect(mockTokenStore.setAccess).toHaveBeenCalledWith('acc');
    expect(mockTokenStore.setRefresh).toHaveBeenCalledWith('ref');
    expect(user).toEqual(FAKE_USER);
  });

  it('lève une erreur si l\'API retourne une erreur', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Invalid credentials'));

    await expect(authService.login('x@x.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  it('appelle POST /auth/login avec email et password', async () => {
    mockRequest
      .mockResolvedValueOnce({ access_token: 'a', refresh_token: 'r' })
      .mockResolvedValueOnce(FAKE_USER);

    await authService.login('alice@example.com', 'pass');

    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      'POST',
      '/auth/login',
      { email: 'alice@example.com', password: 'pass' }
    );
  });

  it('appelle GET /auth/me après le login pour récupérer le profil', async () => {
    mockRequest
      .mockResolvedValueOnce({ access_token: 'a', refresh_token: 'r' })
      .mockResolvedValueOnce(FAKE_USER);

    await authService.login('alice@example.com', 'pass');

    expect(mockRequest).toHaveBeenNthCalledWith(2, 'GET', '/auth/me');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// register()
// ══════════════════════════════════════════════════════════════════════════

describe('authService.register()', () => {
  it('appelle POST /auth/register avec les données correctes', async () => {
    mockRequest.mockResolvedValueOnce(FAKE_USER);

    await authService.register('Alice', 'alice@example.com', 'password123');

    expect(mockRequest).toHaveBeenCalledWith(
      'POST',
      '/auth/register',
      { name: 'Alice', email: 'alice@example.com', password: 'password123' }
    );
  });

  it('retourne l\'utilisateur créé', async () => {
    mockRequest.mockResolvedValueOnce(FAKE_USER);

    const user = await authService.register('Alice', 'alice@example.com', 'pass');
    expect(user).toEqual(FAKE_USER);
  });

  it('propage les erreurs de validation', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Email already exists'));

    await expect(
      authService.register('Alice', 'existing@example.com', 'pass')
    ).rejects.toThrow('Email already exists');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// me()
// ══════════════════════════════════════════════════════════════════════════

describe('authService.me()', () => {
  it('retourne null si aucun token d\'accès', async () => {
    mockTokenStore.getAccess.mockReturnValue(null);

    const user = await authService.me();
    expect(user).toBeNull();
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('appelle GET /auth/me et retourne l\'utilisateur si token présent', async () => {
    mockTokenStore.getAccess.mockReturnValue('valid.token');
    mockRequest.mockResolvedValueOnce(FAKE_USER);

    const user = await authService.me();
    expect(user).toEqual(FAKE_USER);
    expect(mockRequest).toHaveBeenCalledWith('GET', '/auth/me');
  });

  it('retourne null si le token est expiré (SESSION_EXPIRED)', async () => {
    mockTokenStore.getAccess.mockReturnValue('expired.token');
    mockRequest.mockRejectedValueOnce(new Error('SESSION_EXPIRED'));

    const user = await authService.me();
    expect(user).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// logout()
// ══════════════════════════════════════════════════════════════════════════

describe('authService.logout()', () => {
  it('efface les tokens du store', () => {
    authService.logout();
    expect(mockTokenStore.clear).toHaveBeenCalledOnce();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// isAuthenticated()
// ══════════════════════════════════════════════════════════════════════════

describe('authService.isAuthenticated()', () => {
  it('retourne true si un token d\'accès est présent', () => {
    mockTokenStore.getAccess.mockReturnValue('some.token');
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('retourne false si aucun token', () => {
    mockTokenStore.getAccess.mockReturnValue(null);
    expect(authService.isAuthenticated()).toBe(false);
  });
});
