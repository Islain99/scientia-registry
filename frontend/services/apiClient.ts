/**
 * Base HTTP client for the Scientia backend.
 * Keeps the JWT token in localStorage and injects it on every request.
 */

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';

const ACCESS_KEY  = 'scientia_auth_token';
const REFRESH_KEY = 'scientia_refresh_token';

// ── Token store ───────────────────────────────────────────────────────────────

export const tokenStore = {
  getAccess:  (): string | null => { try { return localStorage.getItem(ACCESS_KEY);  } catch { return null; } },
  getRefresh: (): string | null => { try { return localStorage.getItem(REFRESH_KEY); } catch { return null; } },
  setAccess:  (t: string): void => { try { localStorage.setItem(ACCESS_KEY,  t); } catch {} },
  setRefresh: (t: string): void => { try { localStorage.setItem(REFRESH_KEY, t); } catch {} },
  clear: (): void => {
    try { localStorage.removeItem(ACCESS_KEY);  } catch {}
    try { localStorage.removeItem(REFRESH_KEY); } catch {}
  },
};

// ── Core request ──────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.getAccess();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Token expired — notify caller so the UI can prompt re-login
  if (res.status === 401) {
    tokenStore.clear();
    throw new Error('SESSION_EXPIRED');
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `Erreur HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const api = {
  get:    <T>(path: string)                    => request<T>(path),
  post:   <T>(path: string, body: unknown)     => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)     => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown)     => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string)                    => request<T>(path, { method: 'DELETE' }),
};
