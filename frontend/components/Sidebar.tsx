
import React from 'react';
import { Discipline, LearningLevel, UserRole, Permission } from '../types';
import { RoleGuard } from './RoleGuard';
import { 
  BookOpen, FlaskConical, Atom, Binary, GraduationCap, Map, 
  Globe, Database, Settings, Moon, Sun, Star, Home,
  ShieldCheck, UserCog, History, BarChart3, DatabaseZap
} from 'lucide-react';

interface SidebarProps {
  activeDiscipline: Discipline | null;
  onSelectDiscipline: (d: Discipline | null) => void;
  activeLevel: LearningLevel | null;
  onSelectLevel: (l: LearningLevel | null) => void;
  disciplineProgress: Record<Discipline, number>;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  showOnlyFavorites: boolean;
  onToggleFavorites: () => void;
  userRole: UserRole;
  onSelectDashboard: () => void;
  activeView: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeDiscipline, onSelectDiscipline, 
  activeLevel, onSelectLevel,
  disciplineProgress,
  isDarkMode,
  onToggleDarkMode,
  showOnlyFavorites,
  onToggleFavorites,
  userRole,
  onSelectDashboard,
  activeView
}) => {
  const disciplines = Object.values(Discipline);
  const levels = Object.values(LearningLevel);

  const getIcon = (d: Discipline) => {
    switch(d) {
      case Discipline.MATHEMATICS: return <Binary size={18} />;
      case Discipline.PHYSICS: return <Atom size={18} />;
      case Discipline.CHEMISTRY: return <FlaskConical size={18} />;
      case Discipline.BIOLOGY: return <BookOpen size={18} />;
      case Discipline.COMPUTER_SCIENCE: return <Database size={18} />;
      case Discipline.GEOGRAPHY: return <Map size={18} />;
      case Discipline.GEOLOGY: return <Globe size={18} />;
      default: return <Settings size={18} />;
    }
  };

  return (
    <aside className="w-72 bg-white dark:bg-slate-950 border-r dark:border-slate-800 h-screen sticky top-0 overflow-y-auto p-6 hidden lg:flex flex-col scrollbar-hide transition-colors duration-300">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2">
          <GraduationCap className="text-indigo-600 dark:text-indigo-500" />
          Scientia
        </h1>
        <button 
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-all"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="space-y-6 flex-grow">
        <div>
          <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Navigation</h2>
          <div className="space-y-1">
            <button 
              onClick={() => { onSelectDiscipline(null); onSelectLevel(null); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-3 ${activeView === 'registry' && !activeDiscipline && !activeLevel ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
            >
              <Home size={18} />
              <span>Accueil</span>
            </button>
            <RoleGuard userRole={userRole} requiredRole={[UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]}>
                <button 
                onClick={() => onToggleFavorites()}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-3 ${activeView === 'favorites' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                >
                <Star size={18} className={activeView === 'favorites' ? "fill-current" : ""} />
                <span>Favoris</span>
                </button>
            </RoleGuard>
          </div>
        </div>

        {/* Admin Section */}
        <RoleGuard userRole={userRole} requiredRole={[UserRole.ADMIN]}>
          <div>
            <h2 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <UserCog size={10} /> Administration
            </h2>
            <div className="space-y-1">
              <button 
                onClick={onSelectDashboard}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-3 ${activeView === 'dashboard' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600'}`}
              >
                <BarChart3 size={18} />
                <span>Tableau de bord</span>
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-all flex items-center gap-3">
                <DatabaseZap size={18} />
                <span>Gérer le contenu</span>
              </button>
            </div>
          </div>
        </RoleGuard>

        <div>
          <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Disciplines</h2>
          <div className="space-y-1">
            {disciplines.map(d => {
              const progress = disciplineProgress[d] || 0;
              return (
                <button 
                  key={d}
                  onClick={() => onSelectDiscipline(d)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all group ${activeDiscipline === d ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={activeDiscipline === d ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'}>{getIcon(d)}</span>
                    <span className="flex-grow">{d}</span>
                    <RoleGuard userRole={userRole} requiredRole={[UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]}>
                        <span className="text-[10px] text-slate-400">{Math.round(progress)}%</span>
                    </RoleGuard>
                  </div>
                  <RoleGuard userRole={userRole} requiredRole={[UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]}>
                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                        className="h-full bg-indigo-500 dark:bg-indigo-600 transition-all duration-700 ease-out" 
                        style={{ width: `${progress}%` }}
                        />
                    </div>
                  </RoleGuard>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Niveaux</h2>
          <div className="space-y-1">
            {levels.map(l => (
              <button 
                key={l}
                onClick={() => onSelectLevel(l)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${activeLevel === l ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold border-l-4 border-blue-600 pl-2' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-6 border-t dark:border-slate-800 text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${userRole === UserRole.ADMIN ? 'bg-red-500' : userRole === UserRole.TEACHER ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{userRole} MODE</p>
        </div>
        <p className="text-[10px] text-slate-400 font-medium">Scientia Enterprise v2.0.1</p>
      </div>
    </aside>
  );
};
