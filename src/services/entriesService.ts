/**
 * Entries service — wraps all /entries and /users/me/* API calls.
 *
 * The backend returns snake_case (related_ids, created_at, …).
 * This service maps to/from the frontend's camelCase ScientificEntry type
 * so the rest of the app never has to care about the wire format.
 */

import { api } from './apiClient';
import {
  ScientificEntry,
  Discipline,
  LearningLevel,
  EntryStatus,
  ProgressStatus,
  UserProgress,
} from '../types';

// ── Backend wire types ────────────────────────────────────────────────────────

interface BackendEntry {
  id: string;
  title: string;
  discipline: string;
  sub_discipline?: string | null;
  level: string;
  type: string;
  definition: string;
  statement: string;
  context: string;
  examples: string[];
  exercises: unknown[];
  keywords: string[];
  references: string[];
  related_ids: string[];
  last_modified_by?: string | null;
  created_by?: string | null;
  created_at: number;
  updated_at: number;
  status: string;
  origin: string;
  version: number;
}

interface PaginatedBackend {
  items: BackendEntry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface BackendProgress {
  status: string;
  last_updated: number;
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface PaginatedEntries {
  items: ScientificEntry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ListFilters {
  discipline?: Discipline;
  level?:      LearningLevel;
  status?:     EntryStatus;
  search?:     string;
  page?:       number;
  limit?:      number;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function toFrontend(e: BackendEntry): ScientificEntry {
  return {
    id:         e.id,
    title:      e.title,
    discipline: e.discipline  as ScientificEntry['discipline'],
    level:      e.level       as ScientificEntry['level'],
    type:       e.type        as ScientificEntry['type'],
    definition: e.definition,
    statement:  e.statement,
    context:    e.context,
    examples:   e.examples,
    exercises:  e.exercises   as ScientificEntry['exercises'],
    keywords:   e.keywords,
    references: e.references,
    relatedIds: e.related_ids,
    status:     e.status      as ScientificEntry['status'],
    origin:     e.origin      as ScientificEntry['origin'],
    version:    e.version,
    createdAt:  e.created_at,
    updatedAt:  e.updated_at,
  };
}

function toBackend(e: Partial<ScientificEntry>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (e.title      !== undefined) out.title       = e.title;
  if (e.discipline !== undefined) out.discipline  = e.discipline;
  if (e.level      !== undefined) out.level       = e.level;
  if (e.type       !== undefined) out.type        = e.type;
  if (e.definition !== undefined) out.definition  = e.definition;
  if (e.statement  !== undefined) out.statement   = e.statement;
  if (e.context    !== undefined) out.context     = e.context;
  if (e.examples   !== undefined) out.examples    = e.examples;
  if (e.exercises  !== undefined) out.exercises   = e.exercises;
  if (e.keywords   !== undefined) out.keywords    = e.keywords;
  if (e.references !== undefined) out.references  = e.references;
  if (e.relatedIds !== undefined) out.related_ids = e.relatedIds;
  if (e.origin     !== undefined) out.origin      = e.origin;
  return out;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const entriesService = {

  // ── Entries CRUD ────────────────────────────────────────────────────────────

  async list(filters: ListFilters = {}): Promise<PaginatedEntries> {
    const p = new URLSearchParams();
    if (filters.discipline) p.set('discipline', filters.discipline);
    if (filters.level)      p.set('level',      filters.level);
    if (filters.status)     p.set('status',     filters.status);
    if (filters.search)     p.set('search',     filters.search);
    if (filters.page)       p.set('page',       String(filters.page));
    if (filters.limit)      p.set('limit',      String(filters.limit));
    const qs  = p.toString();
    const res = await api.get<PaginatedBackend>(`/entries${qs ? `?${qs}` : ''}`);
    return { ...res, items: res.items.map(toFrontend) };
  },

  async get(id: string): Promise<ScientificEntry> {
    return toFrontend(await api.get<BackendEntry>(`/entries/${id}`));
  },

  async create(entry: ScientificEntry): Promise<ScientificEntry> {
    return toFrontend(await api.post<BackendEntry>('/entries', toBackend(entry)));
  },

  async update(id: string, entry: Partial<ScientificEntry>): Promise<ScientificEntry> {
    return toFrontend(await api.put<BackendEntry>(`/entries/${id}`, toBackend(entry)));
  },

  async updateStatus(id: string, status: EntryStatus): Promise<ScientificEntry> {
    return toFrontend(await api.patch<BackendEntry>(`/entries/${id}/status`, { status }));
  },

  async softDelete(id: string): Promise<void> {
    await api.delete<void>(`/entries/${id}`);
  },

  // ── Favorites ────────────────────────────────────────────────────────────────

  async addFavorite(entryId: string): Promise<void> {
    await api.post<void>(`/users/me/favorites/${entryId}`, {});
  },

  async removeFavorite(entryId: string): Promise<void> {
    await api.delete<void>(`/users/me/favorites/${entryId}`);
  },

  // ── Progress ──────────────────────────────────────────────────────────────────

  async getProgress(): Promise<Record<string, UserProgress>> {
    const raw = await api.get<Record<string, BackendProgress>>('/users/me/progress');
    const out: Record<string, UserProgress> = {};
    for (const [k, v] of Object.entries(raw)) {
      out[k] = { status: v.status as ProgressStatus, lastUpdated: v.last_updated };
    }
    return out;
  },

  async updateProgress(entryId: string, status: ProgressStatus): Promise<void> {
    await api.put<void>(`/users/me/progress/${entryId}`, { status });
  },
};
