
import React, { useState } from 'react';
import { Discipline, LearningLevel, ContentType, ScientificEntry, EntryOrigin, EntryStatus } from '../types';
import { generateScientificEntry } from '../services/geminiService';
import { X, Sparkles, Send, Brain, Save, AlertCircle, RefreshCw } from 'lucide-react';
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
  const { notify } = useNotification();

  const [formData, setFormData] = useState<Partial<ScientificEntry>>(initialData || {
    title: '',
    discipline: Discipline.MATHEMATICS,
    level: LearningLevel.SECONDARY,
    type: ContentType.FORMULA,
    definition: '',
    statement: '',
    context: '',
    examples: [],
    exercises: [],
    keywords: [],
    references: [],
    origin: EntryOrigin.MANUAL,
    status: EntryStatus.DRAFT,
    version: 1
  });

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
        message: 'Veuillez vérifier et valider les données avant l\'enregistrement.'
      });
    } else {
      notify({
        type: 'error',
        title: 'Échec de la génération',
        message: 'L\'IA n\'a pas pu structurer ce concept. Essayez d\'être plus précis.'
      });
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, generate a real unique ID and validate schema
    onSave({
      ...formData as ScientificEntry,
      id: formData.id || Math.random().toString(36).substr(2, 9),
      createdAt: formData.createdAt || Date.now(),
      updatedAt: Date.now(),
      version: (formData.version || 0) + 1
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
        <header className="p-6 border-b dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              {initialData ? 'Modifier le Concept' : 'Nouvel Élément Scientifique'}
              {formData.origin === EntryOrigin.AI && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md uppercase tracking-tighter">AI Draft</span>}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Garantissez la rigueur et la précision scientifique de chaque champ.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
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
            <form id="entry-form" onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Titre Officiel</label>
                  <input 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Discipline</label>
                    <select 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                      value={formData.discipline}
                      onChange={(e) => setFormData({...formData, discipline: e.target.value as Discipline})}
                    >
                      {Object.values(Discipline).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
                    <select 
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as ContentType})}
                    >
                      {Object.values(ContentType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Définition Rigoureuse</label>
                <textarea 
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                  value={formData.definition}
                  onChange={(e) => setFormData({...formData, definition: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Énoncé Formel (LaTeX)</label>
                <div className="relative">
                   <input 
                    required
                    className="w-full bg-slate-900 text-indigo-300 font-mono border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500"
                    value={formData.statement}
                    onChange={(e) => setFormData({...formData, statement: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contexte d'Utilisation</label>
                <textarea 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                  value={formData.context}
                  onChange={(e) => setFormData({...formData, context: e.target.value})}
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/30 flex gap-4">
                  <AlertCircle className="text-amber-600 flex-shrink-0" size={18} />
                  <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                    Assurez-vous que l'énoncé LaTeX est correct. Les macros Scientia (\infint, \reaction, etc.) sont disponibles. Toute modification majeure réinitialisera le statut à "En révision".
                  </p>
              </div>
            </form>
          )}
        </div>

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
