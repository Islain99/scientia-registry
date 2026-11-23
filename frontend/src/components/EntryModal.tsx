
import React, { useState, KeyboardEvent } from 'react';
import {
  Discipline, LearningLevel, ContentType, ScientificEntry,
  EntryOrigin, EntryStatus, ValidationError
} from '../../types';
import { generateScientificEntry } from '../../services/geminiService';
import { validateScientificEntry } from '../../utils/scientificValidator';
import {
  X, Sparkles, Send, Brain, Save, AlertCircle,
  RefreshCw, XCircle, Plus, Tag
} from 'lucide-react';
import { useNotification } from './NotificationSystem';

interface EntryModalProps {
  onClose: () => void;
  onSave: (entry: ScientificEntry) => void;
  initialData?: Partial<ScientificEntry>;
}

export const EntryModal: React.FC<EntryModalProps> = ({ onClose, onSave, initialData }) => {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [loading, setLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const { notify } = useNotification();

  // ── Local UI state for array editors ─────────────────────────────────────
  const [keywordInput, setKeywordInput] = useState('');

  // ── Form data ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<Partial<ScientificEntry>>(initialData || {
    title:         '',
    discipline:    Discipline.MATHEMATICS,
    subDiscipline: '',
    level:         LearningLevel.SECONDARY,
    type:          ContentType.FORMULA,
    definition:    '',
    statement:     '',
    context:       '',
    examples:      [],
    exercises:     [],
    keywords:      [],
    references:    [],
    relatedIds:    [],
    origin:        EntryOrigin.MANUAL,
    status:        EntryStatus.DRAFT,
    version:       1,
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  const addKeyword = (raw: string) => {
    const kw = raw.trim();
    if (!kw) return;
    const existing = formData.keywords ?? [];
    if (!existing.includes(kw)) {
      setFormData(prev => ({ ...prev, keywords: [...existing, kw] }));
    }
  };

  const removeKeyword = (kw: string) => {
    setFormData(prev => ({ ...prev, keywords: (prev.keywords ?? []).filter(k => k !== kw) }));
  };

  const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword(keywordInput);
      setKeywordInput('');
    }
  };

  /** Convertit un textarea (une entrée par ligne) en tableau nettoyé */
  const linesToArray = (text: string): string[] =>
    text.split('\n').map(l => l.trim()).filter(Boolean);

  /** Convertit un tableau en texte de textarea */
  const arrayToLines = (arr: string[]): string => arr.join('\n');

  // ── AI generation ─────────────────────────────────────────────────────────

  const handleAiGenerate = async () => {
    if (!aiInput.trim()) return;
    setLoading(true);
    const result = await generateScientificEntry(aiInput, formData.discipline, formData.level);
    if (result) {
      setFormData(result);
      setMode('manual');
      notify({
        type: 'success',
        title: 'Concept généré !',
        message: 'Vérifiez et validez les données avant l\'enregistrement.',
      });
    } else {
      notify({
        type: 'error',
        title: 'Échec de la génération',
        message: 'L\'IA n\'a pas pu structurer ce concept. Essayez d\'être plus précis.',
      });
    }
    setLoading(false);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateScientificEntry(formData);
    const blockingErrors = errors.filter(err => err.severity === 'error');
    setValidationErrors(errors);

    if (blockingErrors.length > 0) {
      notify({
        type: 'error',
        title: 'Validation échouée',
        message: `${blockingErrors.length} erreur(s) à corriger avant l'enregistrement.`,
      });
      return;
    }

    if (errors.length > 0) {
      notify({
        type: 'warning',
        title: 'Avertissements pédagogiques',
        message: 'Le concept a été enregistré avec des avertissements.',
      });
    }

    onSave({
      ...formData as ScientificEntry,
      id:        formData.id || crypto.randomUUID(),
      createdAt: formData.createdAt || Date.now(),
      updatedAt: Date.now(),
      version:   (formData.version ?? 0) + 1,
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">

        {/* Header */}
        <header className="p-6 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              {initialData ? 'Modifier le Concept' : 'Nouvel Élément Scientifique'}
              {formData.origin === EntryOrigin.AI && (
                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md uppercase tracking-tighter">AI Draft</span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Garantissez la rigueur et la précision scientifique de chaque champ.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">

          {/* Mode toggle */}
          {!initialData && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-8 w-fit mx-auto border border-slate-200 dark:border-slate-700 shadow-inner">
              <button
                onClick={() => setMode('manual')}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'manual' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                Saisie Manuelle
              </button>
              <button
                onClick={() => setMode('ai')}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${mode === 'ai' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                <Sparkles size={14} /> Ajout assisté par IA
              </button>
            </div>
          )}

          {/* ── AI mode ───────────────────────────────────────────────────── */}
          {mode === 'ai' ? (
            <div className="space-y-8 py-10 text-center animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border-2 border-dashed border-indigo-200 dark:border-indigo-900 max-w-lg mx-auto">
                <Brain size={48} className="mx-auto text-indigo-500 mb-4" />
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 mb-2">Que voulez-vous créer ?</h3>
                <p className="text-xs text-indigo-700/60 dark:text-indigo-400 mb-6">
                  Décrivez le concept, collez une définition brute ou un extrait de cours. L'IA structurera tout pour vous.
                </p>
                <textarea
                  className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[120px] shadow-sm mb-4"
                  placeholder="Ex: Explique la deuxième loi de Newton, donne la formule F=ma et un exercice..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                />
                <button
                  onClick={handleAiGenerate}
                  disabled={loading || !aiInput.trim()}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                  Générer la structure scientifique
                </button>
              </div>
            </div>

          ) : (

            /* ── Manual form ──────────────────────────────────────────────── */
            <form id="entry-form" onSubmit={handleSubmit} className="space-y-7 animate-in fade-in duration-300">

              {/* Row 1 : Titre + Sous-discipline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Titre Officiel <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex : Deuxième loi de Newton"
                    value={formData.title ?? ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sous-discipline</label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex : Mécanique classique"
                    value={formData.subDiscipline ?? ''}
                    onChange={(e) => setFormData({ ...formData, subDiscipline: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2 : Discipline + Type + Niveau */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Discipline <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                    value={formData.discipline}
                    onChange={(e) => setFormData({ ...formData, discipline: e.target.value as Discipline })}
                  >
                    {Object.values(Discipline).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ContentType })}
                  >
                    {Object.values(ContentType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Niveau <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as LearningLevel })}
                  >
                    {Object.values(LearningLevel).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Définition */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Définition Rigoureuse <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-y"
                  placeholder="Définition précise et académique du concept."
                  value={formData.definition ?? ''}
                  onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                />
              </div>

              {/* Énoncé LaTeX */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Énoncé Formel (LaTeX) <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  className="w-full bg-slate-900 text-indigo-300 font-mono border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex : F = ma  ou  \frac{a}{b}"
                  value={formData.statement ?? ''}
                  onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                />
                <p className="text-[10px] text-slate-400">
                  Saisissez une expression LaTeX valide. KaTeX sera utilisé pour le rendu.
                </p>
              </div>

              {/* Contexte */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contexte d'Utilisation</label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 resize-y"
                  placeholder="Domaine d'application, conditions, hypothèses…"
                  value={formData.context ?? ''}
                  onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                />
              </div>

              {/* Mots-clés — chip editor */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Tag size={10} /> Mots-clés
                </label>
                {/* Chips existants */}
                {(formData.keywords ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(formData.keywords ?? []).map(kw => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => removeKeyword(kw)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Saisie */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="Tapez un mot-clé et appuyez sur Entrée ou virgule"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    onBlur={() => { if (keywordInput.trim()) { addKeyword(keywordInput); setKeywordInput(''); } }}
                  />
                  <button
                    type="button"
                    onClick={() => { addKeyword(keywordInput); setKeywordInput(''); }}
                    className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-all flex items-center gap-1"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {/* Exemples — une ligne = un exemple */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Exemples <span className="text-slate-300">(un par ligne)</span>
                </label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-y"
                  placeholder={"Calcul de la force sur un objet de 10 kg\nApplications dans les piles à combustible"}
                  value={arrayToLines(formData.examples ?? [])}
                  onChange={(e) => setFormData({ ...formData, examples: linesToArray(e.target.value) })}
                />
              </div>

              {/* Références — une ligne = une référence */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Références <span className="text-slate-300">(une par ligne)</span>
                </label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[64px] resize-y"
                  placeholder={"Principia Mathematica, Newton (1687)\nPhysique Générale, Feynman (1963)"}
                  value={arrayToLines(formData.references ?? [])}
                  onChange={(e) => setFormData({ ...formData, references: linesToArray(e.target.value) })}
                />
              </div>

              {/* Note LaTeX */}
              <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/30 flex gap-4">
                <AlertCircle className="text-amber-600 flex-shrink-0" size={18} />
                <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                  L'énoncé doit être une expression <strong>LaTeX standard</strong> compatible avec KaTeX.
                  Toute modification majeure de l'énoncé réinitialisera le statut à <em>"En révision"</em>.
                </p>
              </div>

              {/* Validation errors */}
              {validationErrors.length > 0 && (
                <div className="space-y-2">
                  {validationErrors.map((err, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-xl text-[11px] font-medium ${
                        err.severity === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                          : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {err.severity === 'error'
                        ? <XCircle size={14} className="flex-shrink-0 mt-px" />
                        : <AlertCircle size={14} className="flex-shrink-0 mt-px" />
                      }
                      <span><strong>{err.field} :</strong> {err.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <footer className="p-6 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Annuler
          </button>
          {mode === 'manual' && (
            <button
              type="submit"
              form="entry-form"
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              <Save size={18} />
              {initialData ? 'Enregistrer les modifications' : 'Créer l\'élément'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
