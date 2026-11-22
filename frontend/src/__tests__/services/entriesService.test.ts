/**
 * Tests unitaires pour services/entriesService.ts
 *
 * Couvre :
 *  1. Les mappers toFrontend() / toBackend() (via les fonctions exportées du service)
 *  2. Les méthodes du service (list, get, create, update, delete)
 *
 * Stratégie :
 *  - On mocke 'services/apiClient' pour contrôler request()
 *  - Les valeurs backend utilisent snake_case ; les valeurs frontend utilisent camelCase
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Discipline, LearningLevel, ContentType, EntryStatus, EntryOrigin } from '../../types';

// ── Mock du module apiClient ───────────────────────────────────────────────
const mockRequest = vi.fn();

vi.mock('../../services/apiClient', () => ({
  request: mockRequest,
  tokenStore: {
    getAccess: vi.fn().mockReturnValue(null),
    getRefresh: vi.fn().mockReturnValue(null),
    setAccess: vi.fn(),
    setRefresh: vi.fn(),
    clear: vi.fn(),
  },
}));

import * as entriesService from '../../services/entriesService';

// ── Données de test ────────────────────────────────────────────────────────

/** Représentation backend typique (snake_case) */
const BACKEND_ENTRY = {
  id: 'entry-1',
  title: 'Deuxième loi de Newton',
  discipline: 'Physique',
  sub_discipline: 'Mécanique',
  level: 'Lycée',
  type: 'Formule',
  definition: 'Relation entre force, masse et accélération.',
  statement: 'F = ma',
  context: 'Mécanique classique.',
  examples: ['Un véhicule de 1000 kg accélère à 2 m/s².'],
  exercises: [],
  keywords: ['force', 'masse', 'accélération'],
  references: ['Newton, 1687'],
  related_ids: ['entry-2', 'entry-3'],
  last_modified_by: 'teacher-1',
  created_by: 'admin-1',
  status: 'active',
  origin: 'manual',
  version: 3,
  created_at: 1700000000,
  updated_at: 1700001000,
};

/** Représentation frontend attendue (camelCase) */
const FRONTEND_ENTRY = {
  id: 'entry-1',
  title: 'Deuxième loi de Newton',
  discipline: 'Physique' as Discipline,
  subDiscipline: 'Mécanique',
  level: 'Lycée' as LearningLevel,
  type: 'Formule' as ContentType,
  definition: 'Relation entre force, masse et accélération.',
  statement: 'F = ma',
  context: 'Mécanique classique.',
  examples: ['Un véhicule de 1000 kg accélère à 2 m/s².'],
  exercises: [],
  keywords: ['force', 'masse', 'accélération'],
  references: ['Newton, 1687'],
  relatedIds: ['entry-2', 'entry-3'],
  lastModifiedBy: 'teacher-1',
  createdBy: 'admin-1',
  status: 'active' as EntryStatus,
  origin: 'manual' as EntryOrigin,
  version: 3,
  createdAt: 1700000000,
  updatedAt: 1700001000,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════
// Mapper toFrontend (via entriesService.get)
// ══════════════════════════════════════════════════════════════════════════

describe('Mapper toFrontend()', () => {
  it('mappe tous les champs snake_case → camelCase', async () => {
    mockRequest.mockResolvedValueOnce(BACKEND_ENTRY);
    const entry = await entriesService.get('entry-1');
    expect(entry).toEqual(FRONTEND_ENTRY);
  });

  it('mappe sub_discipline → subDiscipline', async () => {
    mockRequest.mockResolvedValueOnce(BACKEND_ENTRY);
    const entry = await entriesService.get('entry-1');
    expect(entry.subDiscipline).toBe('Mécanique');
  });

  it('mappe last_modified_by → lastModifiedBy', async () => {
    mockRequest.mockResolvedValueOnce(BACKEND_ENTRY);
    const entry = await entriesService.get('entry-1');
    expect(entry.lastModifiedBy).toBe('teacher-1');
  });

  it('mappe created_by → createdBy', async () => {
    mockRequest.mockResolvedValueOnce(BACKEND_ENTRY);
    const entry = await entriesService.get('entry-1');
    expect(entry.createdBy).toBe('admin-1');
  });

  it('mappe related_ids → relatedIds', async () => {
    mockRequest.mockResolvedValueOnce(BACKEND_ENTRY);
    const entry = await entriesService.get('entry-1');
    expect(entry.relatedIds).toEqual(['entry-2', 'entry-3']);
  });

  it('sub_discipline absent → subDiscipline undefined', async () => {
    const noSub = { ...BACKEND_ENTRY, sub_discipline: undefined };
    mockRequest.mockResolvedValueOnce(noSub);
    const entry = await entriesService.get('entry-1');
    expect(entry.subDiscipline).toBeUndefined();
  });

  it('related_ids vide → relatedIds = []', async () => {
    mockRequest.mockResolvedValueOnce({ ...BACKEND_ENTRY, related_ids: [] });
    const entry = await entriesService.get('entry-1');
    expect(entry.relatedIds).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Mapper toBackend (via entriesService.create)
// ══════════════════════════════════════════════════════════════════════════

describe('Mapper toBackend()', () => {
  it('mappe relatedIds → related_ids', async () => {
    mockRequest.mockResolvedValueOnce(BACKEND_ENTRY);
    await entriesService.create(FRONTEND_ENTRY);
    const sentBody = mockRequest.mock.calls[0][2] as Record<string, unknown>;
    expect(sentBody).toHaveProperty('related_ids', ['entry-2', 'entry-3']);
  });

  it('mappe subDiscipline → sub_discipline', async () => {
    mockRequest.mockResolvedValueOnce(BACKEND_ENTRY);
    await entriesService.create(FRONTEND_ENTRY);
    const sentBody = mockRequest.mock.calls[0][2] as Record<string, unknown>;
    expect(sentBody).toHaveProperty('sub_discipline', 'Mécanique');
  });

  it('n\'envoie pas sub_discipline si subDiscipline est absent', async () => {
    const withoutSub = { ...FRONTEND_ENTRY, subDiscipline: undefined };
    mockRequest.mockResolvedValueOnce(BACKEND_ENTRY);
    await entriesService.create(withoutSub);
    const sentBody = mockRequest.mock.calls[0][2] as Record<string, unknown>;
    expect(sentBody).not.toHaveProperty('sub_discipline');
  });

  it('mappe createdAt → created_at', async () => {
    mockRequest.mockResolvedValueOnce(BACKEND_ENTRY);
    await entriesService.create(FRONTEND_ENTRY);
    const sentBody = mockRequest.mock.calls[0][2] as Record<string, unknown>;
    expect(sentBody).toHaveProperty('created_at', 1700000000);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// entriesService.list()
// ══════════════════════════════════════════════════════════════════════════

describe('entriesService.list()', () => {
  it('appelle GET /entries et retourne un tableau frontend', async () => {
    mockRequest.mockResolvedValueOnce({ items: [BACKEND_ENTRY], total: 1, page: 1, pages: 1 });
    const result = await entriesService.list();
    expect(mockRequest).toHaveBeenCalledWith('GET', expect.stringContaining('/entries'));
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(FRONTEND_ENTRY);
  });

  it('passe les paramètres de filtre dans l\'URL', async () => {
    mockRequest.mockResolvedValueOnce({ items: [], total: 0, page: 1, pages: 1 });
    await entriesService.list({ discipline: 'Physique', level: 'Lycée', limit: 10 });
    const url: string = mockRequest.mock.calls[0][1];
    expect(url).toContain('discipline=Physique');
    expect(url).toContain('level=Lyc%C3%A9e');  // URL-encoded
    expect(url).toContain('limit=10');
  });

  it('retourne un tableau vide si aucun résultat', async () => {
    mockRequest.mockResolvedValueOnce({ items: [], total: 0, page: 1, pages: 1 });
    const result = await entriesService.list();
    expect(result.items).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// entriesService.get()
// ══════════════════════════════════════════════════════════════════════════

describe('entriesService.get()', () => {
  it('appelle GET /entries/:id', async () => {
    mockRequest.mockResolvedValueOnce(BACKEND_ENTRY);
    await entriesService.get('entry-1');
    expect(mockRequest).toHaveBeenCalledWith('GET', '/entries/entry-1');
  });

  it('propage les erreurs 404', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Not Found'));
    await expect(entriesService.get('ghost')).rejects.toThrow('Not Found');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// entriesService.create()
// ══════════════════════════════════════════════════════════════════════════

describe('entriesService.create()', () => {
  it('appelle POST /entries', async () => {
    mockRequest.mockResolvedValueOnce(BACKEND_ENTRY);
    await entriesService.create(FRONTEND_ENTRY);
    expect(mockRequest).toHaveBeenCalledWith('POST', '/entries', expect.any(Object));
  });

  it('retourne l\'entrée créée en camelCase', async () => {
    mockRequest.mockResolvedValueOnce(BACKEND_ENTRY);
    const entry = await entriesService.create(FRONTEND_ENTRY);
    expect(entry.id).toBe('entry-1');
    expect(entry.relatedIds).toEqual(['entry-2', 'entry-3']);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// entriesService.update()
// ══════════════════════════════════════════════════════════════════════════

describe('entriesService.update()', () => {
  it('appelle PATCH /entries/:id avec les données partielles', async () => {
    mockRequest.mockResolvedValueOnce({ ...BACKEND_ENTRY, title: 'Titre modifié' });
    await entriesService.update('entry-1', { title: 'Titre modifié' });
    expect(mockRequest).toHaveBeenCalledWith('PATCH', '/entries/entry-1', expect.any(Object));
  });

  it('retourne l\'entrée mise à jour', async () => {
    mockRequest.mockResolvedValueOnce({ ...BACKEND_ENTRY, title: 'Nouveau titre' });
    const entry = await entriesService.update('entry-1', { title: 'Nouveau titre' });
    expect(entry.title).toBe('Nouveau titre');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// entriesService.remove()
// ══════════════════════════════════════════════════════════════════════════

describe('entriesService.remove()', () => {
  it('appelle DELETE /entries/:id', async () => {
    mockRequest.mockResolvedValueOnce(undefined); // 204 No Content
    await entriesService.remove('entry-1');
    expect(mockRequest).toHaveBeenCalledWith('DELETE', '/entries/entry-1');
  });

  it('ne lève pas d\'erreur sur succès', async () => {
    mockRequest.mockResolvedValueOnce(undefined);
    await expect(entriesService.remove('entry-1')).resolves.not.toThrow();
  });
});
