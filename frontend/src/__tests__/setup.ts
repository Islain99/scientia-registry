/**
 * Setup global pour Vitest.
 * Réinitialise localStorage et les mocks fetch avant chaque test.
 */
import { afterEach, beforeEach, vi } from 'vitest';

// ── Polyfill localStorage (jsdom le fournit, mais on s'assure qu'il est vide) ──
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});
