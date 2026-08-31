/**
 * AI Service — proxies all requests through the Scientia backend.
 * The Gemini API key is NEVER exposed to the browser.
 *
 * Exports are intentionally identical to the old direct-Gemini version
 * so that EntryDetails.tsx and EntryModal.tsx need no import changes.
 */

import { api } from './apiClient';
import { ScientificEntry, LearningLevel, DetailLevel, Discipline, EntryStatus, EntryOrigin } from '../types';

// ── Explain ───────────────────────────────────────────────────────────────────

export const getAIExplanation = async (
  entry: ScientificEntry,
  userLevel: LearningLevel,
  detail: DetailLevel,
): Promise<string> => {
  try {
    const res = await api.post<{ explanation: string }>('/ai/explain', {
      title:       entry.title,
      entry_type:  entry.type,
      discipline:  entry.discipline,
      definition:  entry.definition,
      statement:   entry.statement,
      user_level:  userLevel,
      detail,
    });
    return res.explanation ?? '';
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'SESSION_EXPIRED') {
      return 'Session expirée. Veuillez vous reconnecter pour utiliser l\'IA.';
    }
    console.error('AI Explanation Error:', error);
    return 'Une erreur technique est survenue lors de la génération de l\'explication IA.';
  }
};

// ── Generate ──────────────────────────────────────────────────────────────────

export const generateScientificEntry = async (
  input: string,
  discipline?: Discipline,
  level?: LearningLevel,
): Promise<Partial<ScientificEntry> | null> => {
  try {
    const data = await api.post<Partial<ScientificEntry>>('/ai/generate', {
      raw_input:  input,
      discipline: discipline ?? null,
      level:      level ?? null,
    });
    return {
      ...data,
      origin:    EntryOrigin.AI,
      status:    EntryStatus.PENDING_REVIEW,
      version:   1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  } catch (error: unknown) {
    console.error('AI Generation Error:', error);
    return null;
  }
};

// ── Suggest related ───────────────────────────────────────────────────────────

export const suggestRelatedConcepts = async (
  entry: ScientificEntry,
  allTitles: string[],
): Promise<string[]> => {
  try {
    const res = await api.post<{ suggestions: string[] }>('/ai/suggest-related', {
      title:      entry.title,
      definition: entry.definition,
      all_titles: allTitles,
    });
    return res.suggestions ?? [];
  } catch (error: unknown) {
    console.error('AI Suggestion Error:', error);
    return [];
  }
};
