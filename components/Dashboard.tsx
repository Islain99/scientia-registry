
import React, { useMemo } from 'react';
import { ScientificEntry, Discipline, LearningLevel, EntryStatus, UserRole, ContentType } from '../types';
import { 
  BarChart3, PieChart, Users, BookOpen, AlertCircle, 
  TrendingUp, CheckCircle2, FileText, Database, ShieldCheck 
} from 'lucide-react';

interface DashboardProps {
  entries: ScientificEntry[];
  userRole: UserRole;
}

export const Dashboard: React.FC<DashboardProps> = ({ entries, userRole }) => {
  // --- Data Aggregations ---
  const stats = useMemo(() => {
    const total = entries.length;
    const active = entries.filter(e => e.status === EntryStatus.ACTIVE).length;
    const pending = entries.filter(e => e.status === EntryStatus.PENDING_REVIEW).length;
    const draft = entries.filter(e => e.status === EntryStatus.DRAFT).length;
    
    const disciplineStats = Object.values(Discipline).reduce((acc, d) => {
      acc[d] = entries.filter(e => e.discipline === d).length;
      return acc;
    }, {} as Record<string, number>);

    const levelStats = Object.values(LearningLevel).reduce((acc, l) => {
      acc[l] = entries.filter(e => e.level === l).length;
      return acc;
    }, {} as Record<string, number>);

    const completeness = entries.reduce((acc, e) => {
      let score = 0;
      if (e.examples.length > 0) score += 1;
      if (e.exercises.length > 0) score += 1;
      if (e.references.length > 0) score += 1;
      return acc + (score / 3);
    }, 0);

    const activePct = total > 0 ? Math.round((active / total) * 100) : 0;

    return {
      total,
      active,
      pending,
      draft,
      activePct,
      disciplineStats,
      levelStats,
      avgCompleteness: total > 0 ? (completeness / total) * 100 : 0
    };
  }, [entries]);

  // Fix: Cast Object.values to number[] to satisfy Math.max parameter requirements.
  const maxDisciplineCount = Math.max(...(Object.values(stats.disciplineStats) as number[]));

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
      <header className="mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <BarChart3 className="text-indigo-600" size={32} />
          Dashboard Scientia
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Vue analytique globale du registre de la connaissance.</p>
      </header>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Database size={24} />
            </div>
            {stats.activePct > 0 && (
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                {stats.activePct}% actifs
              </span>
            )}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Concepts</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</h3>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl">
              <AlertCircle size={24} />
            </div>
            {stats.pending > 0 && <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">Priorité</span>}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">En Révision</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.pending}</h3>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Statut Actif</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.active}</h3>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Complétude Moy.</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{Math.round(stats.avgCompleteness)}%</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Discipline Distribution */}
        <section className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-500" />
            Distribution par Discipline
          </h3>
          <div className="space-y-6">
            {Object.entries(stats.disciplineStats).map(([name, count]) => {
              // Fix: Cast count to number for arithmetic operations.
              const percentage = maxDisciplineCount > 0 ? ((count as number) / maxDisciplineCount) * 100 : 0;
              return (
                <div key={name}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-600 dark:text-slate-300">{name}</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Level & Recent Activity */}
        <div className="space-y-10">
          <section className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-2">
              <Users size={20} className="text-indigo-500" />
              Répartition par Niveau Pédagogique
            </h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats.levelStats).map(([level, count]) => (
                <div key={level} className="flex-1 min-w-[120px] bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">{level}</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white">{count}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 dark:bg-black p-8 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <ShieldCheck size={18} /> Dernières Opérations d'Audit
              </h3>
              <div className="space-y-4">
                {entries.slice(0, 4).map((entry, i) => (
                  <div key={entry.id} className="flex items-center gap-4 text-[11px] p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className={`w-2 h-2 rounded-full ${entry.status === EntryStatus.ACTIVE ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div className="flex-grow">
                      <span className="font-bold text-indigo-300">{entry.lastModifiedBy || 'System'}</span>
                      <span className="text-slate-400"> a modifié </span>
                      <span className="text-white font-medium">{entry.title}</span>
                    </div>
                    <span className="text-slate-600 font-mono">v{entry.version}.0</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2 text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                Voir tous les journaux
              </button>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          </section>
        </div>
      </div>

      <div className="mt-10 bg-indigo-600 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl shadow-indigo-200 dark:shadow-none overflow-hidden relative">
        <div className="relative z-10 space-y-4 max-w-xl">
          <h3 className="text-2xl font-black leading-tight">Optimisation de l'IA Pédagogique</h3>
          <p className="text-indigo-100/80 text-sm leading-relaxed">
            {/* Fix: Cast entry values to numbers for arithmetic operations in sort. */}
            Basé sur les dernières statistiques de consultation, l'IA suggère de renforcer le contenu en <strong>{Object.entries(stats.disciplineStats).sort((a,b) => (a[1] as number) - (b[1] as number))[0]?.[0]}</strong> pour les niveaux <strong>Universitaires</strong>.
          </p>
          <button className="px-6 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-all">
            Lancer une génération assistée
          </button>
        </div>
        <div className="relative z-10 flex-grow flex justify-center">
            <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
                <TrendingUp size={80} className="text-white" />
            </div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0, 50 0, 100 100" stroke="white" fill="transparent" strokeWidth="0.5" />
                <path d="M0 100 C 40 20, 70 20, 100 100" stroke="white" fill="transparent" strokeWidth="0.5" />
            </svg>
        </div>
      </div>
    </div>
  );
};
