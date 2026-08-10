
import React from 'react';
import { ScientificEntry, ProgressStatus } from '../types';
import { LatexRenderer } from './LatexRenderer';
import { ExternalLink, Tag, CheckCircle2, CircleDashed, Star } from 'lucide-react';

interface EntryCardProps {
  entry: ScientificEntry;
  onClick: (entry: ScientificEntry) => void;
  progress?: ProgressStatus;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({ 
  entry, onClick, progress = ProgressStatus.NOT_STARTED, isFavorite, onToggleFavorite 
}) => {
  return (
    <div 
      onClick={() => onClick(entry)}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/20 hover:scale-[1.03] hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) cursor-pointer group flex flex-col h-full relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex-grow pr-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
              {entry.discipline}
            </span>
            {progress === ProgressStatus.UNDERSTOOD && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-lg">
                <CheckCircle2 size={10} /> Maîtrisé
              </span>
            )}
            {progress === ProgressStatus.IN_PROGRESS && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-lg">
                <CircleDashed size={10} className="animate-spin" /> En cours
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">{entry.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">{entry.subDiscipline}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button 
            onClick={(e) => onToggleFavorite(e, entry.id)}
            className={`p-2 rounded-xl transition-all ${isFavorite ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}
          >
            <Star size={18} className={isFavorite ? "fill-current" : ""} />
          </button>
          <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-xl text-slate-300 dark:text-slate-500 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-all">
            <ExternalLink size={18} />
          </div>
        </div>
      </div>

      <div className="my-6 bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl flex items-center justify-center min-h-[120px] border border-transparent group-hover:border-indigo-100/50 dark:group-hover:border-indigo-900/50 group-hover:bg-white dark:group-hover:bg-slate-800 transition-all duration-500">
        <LatexRenderer formula={entry.statement} displayMode={false} className="text-xl font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-900 dark:group-hover:text-white" />
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-6 flex-grow leading-relaxed group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
        {entry.definition}
      </p>

      <div className="flex flex-wrap gap-2 mt-auto relative z-10">
        {entry.keywords.slice(0, 3).map(k => (
          <span key={k} className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-400 transition-all">
            <Tag size={10} />
            {k}
          </span>
        ))}
      </div>
      
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors duration-500"></div>
    </div>
  );
};
