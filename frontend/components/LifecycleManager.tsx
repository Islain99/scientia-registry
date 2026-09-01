
import React from 'react';
import { EntryStatus, EntryOrigin, UserRole } from '../types';
import { 
  CheckCircle, Clock, Archive, Trash2, Edit3, 
  Sparkles, User, ShieldCheck, AlertCircle 
} from 'lucide-react';

interface LifecycleManagerProps {
  status: EntryStatus;
  origin: EntryOrigin;
  version: number;
  lastModifiedBy?: string;
  onUpdateStatus: (status: EntryStatus) => void;
  userRole: UserRole;
}

export const LifecycleManager: React.FC<LifecycleManagerProps> = ({ 
  status, origin, version, lastModifiedBy, onUpdateStatus, userRole 
}) => {
  if (userRole === UserRole.STUDENT || userRole === UserRole.GUEST) return null;

  const statusConfig = {
    [EntryStatus.ACTIVE]: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle size={14}/>, label: 'Actif' },
    [EntryStatus.PENDING_REVIEW]: { color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Clock size={14}/>, label: 'En révision' },
    [EntryStatus.DRAFT]: { color: 'text-slate-600 bg-slate-50 border-slate-200', icon: <Edit3 size={14}/>, label: 'Brouillon' },
    [EntryStatus.ARCHIVED]: { color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: <Archive size={14}/>, label: 'Archivé' },
    [EntryStatus.DELETED]: { color: 'text-red-600 bg-red-50 border-red-200', icon: <Trash2 size={14}/>, label: 'Supprimé' },
  };

  const config = statusConfig[status];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-8 animate-in fade-in slide-in-from-top-2">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Statut Actuel</span>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${config.color}`}>
              {config.icon}
              {config.label}
            </div>
          </div>

          <div className="h-10 w-px bg-slate-100 dark:bg-slate-800"></div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Origine & Version</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {origin === EntryOrigin.AI ? <Sparkles size={14} className="text-indigo-500" /> : <User size={14} className="text-slate-400" />}
                {origin === EntryOrigin.AI ? 'Généré par IA' : 'Saisie Manuelle'}
              </div>
              <div className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black">
                v{version}.0
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status !== EntryStatus.ACTIVE && (
            <button 
              onClick={() => onUpdateStatus(EntryStatus.ACTIVE)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
            >
              <ShieldCheck size={16} /> Publier
            </button>
          )}
          {status === EntryStatus.ACTIVE && (
            <button 
              onClick={() => onUpdateStatus(EntryStatus.ARCHIVED)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
            >
              <Archive size={16} /> Archiver
            </button>
          )}
          <button 
            onClick={() => onUpdateStatus(EntryStatus.DELETED)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
            title="Supprimer (Soft Delete)"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center gap-2 text-[10px] text-slate-400 italic">
        <AlertCircle size={12} />
        Dernière modification par <span className="font-bold text-slate-500">{lastModifiedBy || 'Système'}</span>. Toute modification majeure incrémentera la version et nécessitera une nouvelle révision.
      </div>
    </div>
  );
};
