/**
 * Tests unitaires pour services/apiClient.ts
 *
 * Stratégie :
 *  - Toutes les opérations réseau sont mockées avec vi.stubGlobal('fetch', …)
 *  - localStorage est fourni par jsdom (vidé dans setup.ts)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Helpers pour construire une réponse fetch fictive ──────────────────────
function makeResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): Response {
  return new Response(
    body !== undefined ? JSON.stringify(body) : null,
    {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    }
  );
}

// ── Import après avoir préparé l'environnement ─────────────────────────────
// On importe de manière dynamique pour pouvoir tester le comportement avec
// différentes valeurs de localStorage.
let tokenStore: {
  getAccess: () => string | null;
  getRefresh: () => string | null;
  setAccess: (t: string) => void;
  setRefresh: (t: string) => void;
  clear: () => void;
};
let request: <T>(method: string, path: string, body?: unknown) => Promise<T>;

beforeEach(async () => {
  // Réimporte proprement après le clear() de setup.ts
  vi.resetModules();
  const mod = await import('../../services/apiClient');
  tokenStore = mod.tokenStore;
  request = mod.request;
});

// ══════════════════════════════════════════════════════════════════════════
// tokenStore
// ══════════════════════════════════════════════════════════════════════════

describe('tokenStore', () => {
  it('retourne null quand aucun token n\'est enregistré', () => {
    expect(tokenStore.getAccess()).toBeNull();
    expect(tokenStore.getRefresh()).toBeNull();
  });

  it('stocke et relit le token d\'accès', () => {
    tokenStore.setAccess('access.jwt.token');
    expect(tokenStore.getAccess()).toBe('access.jwt.token');
  });

  it('stocke et relit le token de refresh', () => {
    tokenStore.setRefresh('refresh.jwt.token');
    expect(tokenStore.getRefresh()).toBe('refresh.jwt.token');
  });

  it('clear() supprime les deux tokens', () => {
    tokenStore.setAccess('a');
    tokenStore.setRefresh('r');
    tokenStore.clear();
    expect(tokenStore.getAccess()).toBeNull();
    expect(tokenStore.getRefresh()).toBeNull();
  });

  it('résiste à un localStorage corrompu (try/catch)', () => {
    // Simule un Storage qui lève une exception
    const original = localStorage.getItem;
    localStorage.getItem = () => { throw new Error('QuotaExceeded'); };
    expect(() => tokenStore.getAccess()).not.toThrow();
    localStorage.getItem = original;
  });
});

// ══════════════════════════════════════════════════════════════════════════
// request()
// ══════════════════════════════════════════════════════════════════════════

describe('request()', () => {
  it('envoie GET sans corps', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await request('GET', '/api/test');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/test');
    expect(opts.method).toBe('GET');
    expect(opts.body).toBeUndefined();
  });

  it('envoie POST avec corps JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(201, { id: '1' }));
    vi.stubGlobal('fetch', fetchMock);

    await request('POST', '/api/entries', { title: 'Test' });

    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body as string)).toEqual({ title: 'Test' });
    expect(opts.headers['Content-Type']).toBe('application/json');
  });

  it('injecte le Bearer token si disponible', async () => {
    tokenStore.setAccess('my.access.token');
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, {}));
    vi.stubGlobal('fetch', fetchMock);

    await request('GET', '/api/me');

    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.headers['Authorization']).toBe('Bearer my.access.token');
  });

  it('n\'injecte pas Authorization si aucun token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, {}));
    vi.stubGlobal('fetch', fetchMock);

    await request('GET', '/api/public');

    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.headers['Authorization']).toBeUndefined();
  });

  it('retourne undefined sur 204 No Content', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await request('DELETE', '/api/fav/1');
    expect(result).toBeUndefined();
  });

  it('lève SESSION_EXPIRED sur 401 et efface les tokens', async () => {
    tokenStore.setAccess('old.token');
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(401, { detail: 'Unauthorized' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(request('GET', '/api/me')).rejects.toThrow('SESSION_EXPIRED');
    expect(tokenStore.getAccess()).toBeNull();
  });

  it('lève une erreur sur 404', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(404, { detail: 'Not found' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(request('GET', '/api/entries/unknown')).rejects.toThrow();
  });

  it('lève une erreur sur 422 Validation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse(422, { detail: [{ loc: ['body', 'email'], msg: 'invalid email' }] })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(request('POST', '/api/auth/register', { email: 'bad' })).rejects.toThrow();
  });
});
