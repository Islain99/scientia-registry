
import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { EntryCard } from './components/EntryCard';
import { EntryDetails } from './components/EntryDetails';
import { EntryModal } from './components/EntryModal';
import { Dashboard } from './components/Dashboard';
import { INITIAL_ENTRIES } from './constants';
import { ScientificEntry, Discipline, LearningLevel, ProgressStatus, UserProgress, UserRole, Permission, EntryStatus } from './types';
import { RoleGuard, usePermissions } from './components/RoleGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationProvider, useNotification } from './components/NotificationSystem';
import { validateScientificEntry } from './utils/scientificValidator';
import { 
  Search, History, UserCircle, SlidersHorizontal, Info, 
  Trophy, GraduationCap, ShieldCheck, UserCog, UserCheck, 
  Eye, Settings, AlertCircle 
} from 'lucide-react';

type ActiveView = 'registry' | 'dashboard' | 'favorites';

const AppContent: React.FC = () => {
  const [entries, setEntries] = useState<ScientificEntry[]>(INITIAL_ENTRIES);
  const [selectedEntry, setSelectedEntry] = useState<ScientificEntry | null>(null);
  const [activeDiscipline, setActiveDiscipline] = useState<Discipline | null>(null);
  const [activeLevel, setActiveLevel] = useState<LearningLevel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ActiveView>('registry');
  
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScientificEntry | null>(null);
  const { notify } = useNotification();
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('scientia_theme') === 'dark';
  });

  // RBAC User Role
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('scientia_role') as UserRole) || UserRole.STUDENT;
  });

  const { can, is } = usePermissions(userRole);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('scientia_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // User progress state
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>(() => {
    const saved = localStorage.getItem('scientia_progress');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('scientia_progress', JSON.stringify(userProgress));
  }, [userProgress]);

  useEffect(() => {
    localStorage.setItem('scientia_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('scientia_role', userRole);
  }, [userRole]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('scientia_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('scientia_theme', 'light');
    }
  }, [isDarkMode]);

  const updateProgress = (entryId: string, status: ProgressStatus) => {
    setUserProgress(prev => ({
      ...prev,
      [entryId]: {
        status,
        lastUpdated: Date.now()
      }
    }));
    
    if (status === ProgressStatus.UNDERSTOOD) {
      notify({
        type: 'success',
        title: 'Concept maîtrisé !',
        message: 'Votre progression a été enregistrée avec succès.'
      });
    }
  };

  const updateEntryStatus = (id: string, status: EntryStatus) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status, updatedAt: Date.now() } : e));
    if (selectedEntry?.id === id) {
      setSelectedEntry(prev => prev ? { ...prev, status } : null);
    }
    notify({
      type: 'info',
      title: 'Statut mis à jour',
      message: `Le concept est désormais marqué comme ${status}.`
    });
  };

  const handleSaveEntry = (newEntry: ScientificEntry) => {
    if (editingEntry) {
      setEntries(prev => prev.map(e => e.id === newEntry.id ? newEntry : e));
      if (selectedEntry?.id === newEntry.id) setSelectedEntry(newEntry);
      notify({ type: 'success', title: 'Concept mis à jour', message: 'Les modifications ont été enregistrées.' });
    } else {
      setEntries(prev => [newEntry, ...prev]);
      notify({ type: 'success', title: 'Concept créé', message: 'Le nouvel élément a été ajouté au registre (statut: Brouillon).' });
    }
    setIsEntryModalOpen(false);
    setEditingEntry(null);
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const isAdding = !favorites.includes(id);
    setFavorites(prev => 
      isAdding ? [...prev, id] : prev.filter(fid => fid !== id)
    );
    notify({ type: 'info', title: isAdding ? 'Favoris +' : 'Favoris -', message: isAdding ? 'Concept ajouté.' : 'Concept retiré.' });
  };

  const disciplineProgress = useMemo(() => {
    const stats: Record<string, number> = {};
    Object.values(Discipline).forEach(d => {
      const disciplineEntries = entries.filter(e => e.discipline === d && e.status === EntryStatus.ACTIVE);
      if (disciplineEntries.length === 0) {
        stats[d] = 0;
        return;
      }
      const mastered = disciplineEntries.filter(e => userProgress[e.id]?.status === ProgressStatus.UNDERSTOOD).length;
      const inProgress = disciplineEntries.filter(e => userProgress[e.id]?.status === ProgressStatus.IN_PROGRESS).length;
      stats[d] = ((mastered + inProgress * 0.5) / disciplineEntries.length) * 100;
    });
    return stats as Record<Discipline, number>;
  }, [entries, userProgress]);

  const globalProgress = useMemo(() => {
    const activeEntries = entries.filter(e => e.status === EntryStatus.ACTIVE);
    if (activeEntries.length === 0) return 0;
    const mastered = activeEntries.filter(e => userProgress[e.id]?.status === ProgressStatus.UNDERSTOOD).length;
    return (mastered / activeEntries.length) * 100;
  }, [entries, userProgress]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (entry.status === EntryStatus.DELETED) return false;
      
      if (userRole === UserRole.STUDENT || userRole === UserRole.GUEST) {
        if (entry.status !== EntryStatus.ACTIVE) return false;
        if (userRole === UserRole.GUEST && entry.level !== LearningLevel.PRIMARY && entry.level !== LearningLevel.SECONDARY) return false;
      }

      const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDiscipline = activeDiscipline ? entry.discipline === activeDiscipline : true;
      const matchesLevel = activeLevel ? entry.level === activeLevel : true;
      const matchesFavorites = activeView === 'favorites' ? favorites.includes(entry.id) : true;
      
      return matchesSearch && matchesDiscipline && matchesLevel && matchesFavorites;
    });
  }, [entries, searchQuery, activeDiscipline, activeLevel, activeView, favorites, userRole]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Sidebar 
        activeDiscipline={activeDiscipline}
        onSelectDiscipline={(d) => { setActiveDiscipline(d); setActiveView('registry'); setSelectedEntry(null); }}
        activeLevel={activeLevel}
        onSelectLevel={(l) => { setActiveLevel(l); setActiveView('registry'); setSelectedEntry(null); }}
        disciplineProgress={disciplineProgress}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        showOnlyFavorites={activeView === 'favorites'}
        onToggleFavorites={() => { setActiveView(activeView === 'favorites' ? 'registry' : 'favorites'); setSelectedEntry(null); }}
        userRole={userRole}
        onSelectDashboard={() => { setActiveView('dashboard'); setSelectedEntry(null); }}
        activeView={activeView}
      />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher une formule, un théorème..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-xl text-sm dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button onClick={() => setUserRole(UserRole.STUDENT)} title="Mode Étudiant" className={`p-2 rounded-lg transition-all ${userRole === UserRole.STUDENT ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><GraduationCap size={16} /></button>
              <button onClick={() => setUserRole(UserRole.TEACHER)} title="Mode Enseignant" className={`p-2 rounded-lg transition-all ${userRole === UserRole.TEACHER ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><ShieldCheck size={16} /></button>
              <button onClick={() => setUserRole(UserRole.ADMIN)} title="Mode Administrateur" className={`p-2 rounded-lg transition-all ${userRole === UserRole.ADMIN ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><UserCog size={16} /></button>
              <button onClick={() => setUserRole(UserRole.GUEST)} title="Mode Invité" className={`p-2 rounded-lg transition-all ${userRole === UserRole.GUEST ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Eye size={16} /></button>
            </div>

            <RoleGuard userRole={userRole} requiredRole={[UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]}>
              <div className="hidden lg:flex items-center gap-3 min-w-[120px]">
                <div className="flex-grow">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <span>{userRole === UserRole.TEACHER ? 'Validation' : 'Maîtrise'}</span>
                    <span>{Math.round(globalProgress)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${globalProgress}%` }} />
                  </div>
                </div>
              </div>
            </RoleGuard>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <UserCircle size={20} className="text-slate-400" />
                <span className="hidden sm:inline">{userRole === UserRole.ADMIN ? 'Admin Root' : 'Einstein S.'}</span>
              </button>
            </div>
          </div>
        </header>

        {selectedEntry ? (
          <EntryDetails 
            entry={selectedEntry} 
            onBack={() => setSelectedEntry(null)} 
            relatedEntries={entries.filter(e => selectedEntry.relatedIds?.includes(e.id))}
            onNavigate={(e) => setSelectedEntry(e)}
            userProgress={userProgress[selectedEntry.id]}
            onUpdateProgress={updateProgress}
            isFavorite={favorites.includes(selectedEntry.id)}
            onToggleFavorite={toggleFavorite}
            allEntries={entries}
            userRole={userRole}
            onUpdateStatus={updateEntryStatus}
            onEdit={(e) => { setEditingEntry(e); setIsEntryModalOpen(true); }}
          />
        ) : activeView === 'dashboard' ? (
          <Dashboard entries={entries} userRole={userRole} />
        ) : (
          <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                  {activeView === 'favorites' ? 'Mes Favoris' : 'Registre Scientifique'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {filteredEntries.length} concept{filteredEntries.length > 1 ? 's' : ''} indexé{filteredEntries.length > 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <RoleGuard userRole={userRole} permission={Permission.CONTENT_CREATE}>
                    <button 
                      onClick={() => { setEditingEntry(null); setIsEntryModalOpen(true); }}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <UserCheck size={16} />
                        Nouveau Concept
                    </button>
                </RoleGuard>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEntries.map(entry => (
                <EntryCard 
                  key={entry.id} 
                  entry={entry} 
                  onClick={setSelectedEntry} 
                  progress={userProgress[entry.id]?.status}
                  isFavorite={favorites.includes(entry.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {isEntryModalOpen && (
        <EntryModal 
          onClose={() => { setIsEntryModalOpen(false); setEditingEntry(null); }}
          onSave={handleSaveEntry}
          initialData={editingEntry || undefined}
        />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  </ErrorBoundary>
);

export default App;
