
import React, { useState, useEffect } from 'react';
import { ScientificEntry, LearningLevel, ProgressStatus, UserProgress, DetailLevel, UserRole, Permission, EntryStatus } from '../types';
import { LatexRenderer } from './LatexRenderer';
import { getAIExplanation, suggestRelatedConcepts } from '../services/geminiService';
import { RoleGuard } from './RoleGuard';
import { LifecycleManager } from './LifecycleManager';
import { 
  ChevronLeft, Brain, Book, CheckCircle, Info, 
  HelpCircle, RefreshCw, Send, Link as LinkIcon, 
  CircleDashed, CheckCircle2, History, Star, 
  Printer, Code, Sparkles, Plus, Search, Eye, EyeOff,
  ShieldCheck, GraduationCap, Edit3, Trash2
} from 'lucide-react';

interface EntryDetailsProps {
  entry: ScientificEntry;
  onBack: () => void;
  relatedEntries?: ScientificEntry[];
  onNavigate: (entry: ScientificEntry) => void;
  userProgress?: UserProgress;
  onUpdateProgress: (id: string, status: ProgressStatus) => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  allEntries: ScientificEntry[];
  userRole: UserRole;
  onUpdateStatus: (id: string, status: EntryStatus) => void;
  onEdit: (entry: ScientificEntry) => void;
}

export const EntryDetails: React.FC<EntryDetailsProps> = ({ 
  entry, onBack, relatedEntries = [], onNavigate, userProgress, onUpdateProgress,
  isFavorite, onToggleFavorite, allEntries, userRole, onUpdateStatus, onEdit
}) => {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'exercises' | 'ai'>('info');
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [selectedDetail, setSelectedDetail] = useState<DetailLevel>(DetailLevel.SIMPLE);
  
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const fetchAIExplanation = async (detail: DetailLevel) => {
    setSelectedDetail(detail);
    setIsAiLoading(true);
    const expl = await getAIExplanation(entry, entry.level, detail);
    setAiExplanation(expl || "Impossible de charger l'explication.");
    setIsAiLoading(false);
  };

  const getAiSuggestions = async () => {
    setIsSuggesting(true);
    const titles = allEntries.map(e => e.title);
    const suggestions = await suggestRelatedConcepts(entry, titles);
    setAiSuggestions(suggestions.filter(s => s !== entry.title));
    setIsSuggesting(false);
  };

  const exportToLatex = () => {
    const texContent = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{amsfonts}
\\usepackage{amssymb}
\\usepackage{mhchem}

\\title{${entry.title}}
\\author{Scientia Registry}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
\\textbf{Discipline:} ${entry.discipline} \\\\
\\textbf{Niveau:} ${entry.level} \\\\
\\textbf{Type:} ${entry.type}

\\section{Définition}
${entry.definition}

\\section{Énoncé Formel}
\\[ ${entry.statement} \\]

\\section{Contexte et Application}
${entry.context}

\\end{document}`;

    const blob = new Blob([texContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entry.title.replace(/\s+/g, '_')}.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    window.print();
  };

  useEffect(() => {
    window.scrollTo(0,0);
    setAiSuggestions([]);
    if (userRole === UserRole.TEACHER || userRole === UserRole.ADMIN) {
        setSelectedDetail(DetailLevel.EXPERT);
    } else {
        setSelectedDetail(DetailLevel.SIMPLE);
    }
  }, [entry.id, userRole]);

  const currentStatus = userProgress?.status ?? ProgressStatus.NOT_STARTED;
  const suggestedEntries = allEntries.filter(e => aiSuggestions.includes(e.title));

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Navigation & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 no-print gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium group"
        >
          <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
            <ChevronLeft size={20} />
          </div>
          Retour au registre
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <RoleGuard userRole={userRole} requiredRole={[UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]}>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mr-2">
                {[
                { status: ProgressStatus.NOT_STARTED, label: 'À faire', icon: <History size={14}/> },
                { status: ProgressStatus.IN_PROGRESS, label: 'En cours', icon: <CircleDashed size={14}/> },
                { status: ProgressStatus.UNDERSTOOD, label: 'Acquis', icon: <CheckCircle2 size={14}/> },
                ].map((s) => (
                <button
                    key={s.status}
                    onClick={() => onUpdateProgress(entry.id, s.status)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    currentStatus === s.status 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                    }`}
                >
                    {s.icon}
                    <span className="hidden md:inline">{s.label}</span>
                </button>
                ))}
              </div>
          </RoleGuard>
          
          <div className="flex items-center gap-2">
            <RoleGuard userRole={userRole} permission={Permission.CONTENT_UPDATE}>
                <button 
                  onClick={() => onEdit(entry)}
                  className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-all" 
                  title="Modifier le concept"
                >
                  <Edit3 size={20} />
                </button>
            </RoleGuard>
            <RoleGuard userRole={userRole} permission={Permission.CONTENT_DELETE}>
                <button 
                  onClick={() => onUpdateStatus(entry.id, EntryStatus.DELETED)}
                  className="p-2 text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-xl hover:bg-red-100 transition-all" 
                  title="Supprimer le concept"
                >
                  <Trash2 size={20} />
                </button>
            </RoleGuard>
            <RoleGuard userRole={userRole} requiredRole={[UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]}>
                <button 
                onClick={(e) => onToggleFavorite(e, entry.id)}
                className={`p-2 rounded-xl transition-all ${isFavorite ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-amber-50'}`}
                title="Favoris"
                >
                <Star size={20} className={isFavorite ? "fill-current" : ""} />
                </button>
            </RoleGuard>
            <button 
              onClick={exportToPDF}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
              title="Exporter PDF"
            >
              <Printer size={20} />
            </button>
            <button 
              onClick={exportToLatex}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
              title="Source LaTeX"
            >
              <Code size={20} />
            </button>
          </div>
        </div>
      </div>

      <LifecycleManager 
        status={entry.status}
        origin={entry.origin}
        version={entry.version}
        lastModifiedBy={entry.lastModifiedBy}
        userRole={userRole}
        onUpdateStatus={(s) => onUpdateStatus(entry.id, s)}
      />

      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-widest rounded-full">{entry.discipline}</span>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-widest rounded-full">{entry.level}</span>
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-full">{entry.type}</span>
          <RoleGuard userRole={userRole} requiredRole={[UserRole.TEACHER, UserRole.ADMIN]}>
             <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
               <ShieldCheck size={10} /> Mode Évaluation
             </span>
          </RoleGuard>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 leading-tight tracking-tight">{entry.title}</h1>
        {entry.subDiscipline && <p className="text-lg text-slate-500 dark:text-slate-400 font-medium italic opacity-80">{entry.subDiscipline}</p>}
      </header>

      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto scrollbar-hide no-print">
        <button 
          onClick={() => setActiveTab('info')}
          className={`px-6 py-3 text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'info' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          <Book size={18} /> Documentation
        </button>
        <button 
          onClick={() => setActiveTab('exercises')}
          className={`px-6 py-3 text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'exercises' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          <HelpCircle size={18} /> Exercices d'application
        </button>
        <RoleGuard userRole={userRole} requiredRole={[UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]}>
            <button 
            onClick={() => setActiveTab('ai')}
            className={`px-6 py-3 text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'ai' ? 'border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
            <Brain size={18} /> Deep Learning (IA)
            </button>
        </RoleGuard>
      </div>

      {activeTab === 'info' && (
        <div className="space-y-12">
          {/* Main Statement */}
          <section className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Code size={48} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Info className="text-indigo-500" size={24} /> Énoncé Formel
            </h2>
            <div className="bg-slate-50 dark:bg-slate-900/80 p-10 rounded-xl mb-6 text-center border border-slate-200 dark:border-slate-700 shadow-inner group-hover:bg-white dark:group-hover:bg-slate-800 transition-all duration-500">
              <LatexRenderer formula={entry.statement} displayMode={true} className="text-3xl text-indigo-950 dark:text-indigo-100" />
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Définition de Référence</h3>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-lg font-medium">{entry.definition}</p>
            </div>
          </section>

          {/* Context & Related */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Contexte & Phénoménologie</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{entry.context}</p>
              </section>

              <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Exemples Pratiques</h2>
                <ul className="space-y-4">
                  {entry.examples.map((ex, i) => (
                    <li key={i} className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 items-start hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors">
                      <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center text-xs font-bold">{i+1}</span>
                      {ex}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Sidebar Linkage */}
            <div className="space-y-6">
              <section className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <LinkIcon size={16} className="text-indigo-500" /> Concepts Liés
                </h2>
                
                {relatedEntries.length > 0 ? (
                  <div className="space-y-3">
                    {relatedEntries.map(rel => (
                      <button 
                        key={rel.id}
                        onClick={() => onNavigate(rel)}
                        className="w-full flex flex-col p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all text-left group"
                      >
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-1">{rel.title}</h4>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">{rel.discipline}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[10px] text-slate-500 mb-4 italic">Aucun lien manuel défini.</p>
                  </div>
                )}

                {/* AI Relationship Discovery */}
                <RoleGuard userRole={userRole} permission={Permission.AI_ADVANCED}>
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Sparkles size={10} /> Découverte par IA
                    </h3>
                    
                    {aiSuggestions.length === 0 ? (
                        <button 
                        onClick={getAiSuggestions}
                        disabled={isSuggesting}
                        className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                        {isSuggesting ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                        Suggérer des liens
                        </button>
                    ) : (
                        <div className="space-y-2">
                        {suggestedEntries.map(rel => (
                            <button 
                            key={rel.id}
                            onClick={() => onNavigate(rel)}
                            className="w-full flex items-center gap-3 p-2 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-lg hover:border-indigo-300 transition-all text-left"
                            >
                            <Search size={10} className="text-indigo-400" />
                            <span className="text-[10px] font-medium text-indigo-700 dark:text-indigo-300">{rel.title}</span>
                            </button>
                        ))}
                        <button 
                            onClick={() => setAiSuggestions([])}
                            className="text-[9px] text-slate-400 hover:text-slate-600 block mt-2 mx-auto"
                        >
                            Masquer suggestions
                        </button>
                        </div>
                    )}
                    </div>
                </RoleGuard>
              </section>

              {/* Expert References */}
              <RoleGuard userRole={userRole} requiredRole={[UserRole.TEACHER, UserRole.ADMIN]}>
                <section className="bg-slate-900 dark:bg-black text-white p-6 rounded-2xl no-print border border-slate-800 shadow-xl">
                  <h2 className="text-xs font-bold mb-3 flex items-center gap-2 text-indigo-300 uppercase tracking-widest">
                    <ShieldCheck size={14} /> Références Académiques
                  </h2>
                  <ul className="space-y-2 text-slate-400 text-[10px] italic">
                    {entry.references.map((ref, i) => (
                      <li key={i} className="line-clamp-2 hover:line-clamp-none cursor-default transition-all border-l border-indigo-500/30 pl-2 py-1">• {ref}</li>
                    ))}
                  </ul>
                </section>
              </RoleGuard>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Exercises & AI */}
      <div className="no-print">
        {activeTab === 'exercises' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            {entry.exercises.length > 0 ? entry.exercises.map((ex, i) => (
              <div key={ex.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {ex.type === 'guided' ? <GraduationCap size={16} className="text-blue-500"/> : <CheckCircle size={16} className="text-emerald-500"/>}
                    Problème Scientifique {i + 1}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${ex.difficulty === 'easy' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : ex.difficulty === 'medium' ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
                    {ex.difficulty}
                  </span>
                </div>
                <div className="p-8">
                  <p className="text-slate-800 dark:text-slate-200 text-lg mb-8 leading-relaxed font-medium">{ex.question}</p>
                  
                  {ex.steps && (
                    <div className="mb-8 space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <History size={12} /> Méthodologie pas-à-pas
                      </p>
                      {ex.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-4 text-sm text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-lg">
                           <span className="text-indigo-500 font-bold">{idx + 1}.</span>
                           {step}
                        </div>
                      ))}
                    </div>
                  )}

                  <RoleGuard userRole={userRole} requiredRole={[UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]}>
                      <div className="flex items-center justify-between mt-6">
                        <button 
                            onClick={() => setShowSolution(prev => ({...prev, [ex.id]: !prev[ex.id]}))}
                            className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                        >
                            {showSolution[ex.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                            {showSolution[ex.id] ? "Dissimuler la résolution" : "Révéler la résolution complète"}
                        </button>
                      </div>
                      
                      {showSolution[ex.id] && (
                        <div className="mt-6 p-6 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-100 dark:border-emerald-800/30 animate-in zoom-in-95 duration-200 shadow-inner">
                          <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter">
                              <CheckCircle2 size={12} /> Solution détaillée
                          </div>
                          <p className="font-mono text-sm whitespace-pre-wrap">{ex.solution}</p>
                        </div>
                      )}
                  </RoleGuard>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <HelpCircle className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun exercice statique indexé.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-indigo-900 dark:bg-indigo-950 text-white p-8 rounded-3xl relative overflow-hidden shadow-2xl border border-white/5">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-indigo-500 p-4 rounded-3xl shadow-xl shadow-indigo-500/50">
                    <Brain className="text-white" size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Scientia Neural Network</h2>
                    <p className="text-indigo-300 text-sm">Exploration assistée par intelligence générative.</p>
                  </div>
                </div>

                {!aiExplanation && !isAiLoading && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <p className="text-indigo-100/70 text-sm mb-6 max-w-xl">
                      Notre modèle d'IA pédagogique peut générer une explication structurée adaptée à votre profil d'apprentissage.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {[
                        { level: DetailLevel.SIMPLE, title: 'Conceptuel', desc: 'Intuition & Analogies', icon: <Sparkles size={20}/> },
                        { level: DetailLevel.DETAILED, title: 'Analytique', desc: 'Preuve & Contexte', icon: <Book size={20}/> },
                        { level: DetailLevel.EXPERT, title: 'Rigoureux', desc: 'Formalisme Avancé', icon: <Code size={20}/> }
                      ].map((d) => (
                        <button 
                          key={d.level}
                          onClick={() => fetchAIExplanation(d.level)}
                          className="p-5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-left transition-all group hover:-translate-y-1 relative overflow-hidden"
                        >
                          <div className="p-2 bg-white/10 rounded-lg w-fit mb-3 text-indigo-300 group-hover:text-white transition-colors">
                            {d.icon}
                          </div>
                          <div className="font-bold mb-1">{d.title}</div>
                          <p className="text-[10px] text-indigo-200 leading-tight">{d.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isAiLoading && (
                  <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-indigo-400/20 border-t-indigo-400 rounded-full animate-spin"></div>
                      <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" size={24} />
                    </div>
                    <div className="text-center text-indigo-200 uppercase tracking-widest text-xs font-bold">Traitement Neural en cours</div>
                  </div>
                )}

                {aiExplanation && !isAiLoading && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl prose prose-invert max-w-none text-indigo-50 text-sm leading-relaxed whitespace-pre-wrap font-medium shadow-inner">
                      {aiExplanation}
                    </div>
                    <div className="flex justify-between items-center mt-8">
                      <button 
                        onClick={() => setAiExplanation(null)}
                        className="text-xs text-indigo-300 hover:text-white font-bold uppercase tracking-widest flex items-center gap-2 group px-4 py-2 bg-white/5 rounded-xl transition-all"
                      >
                        <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" /> Nouvelle analyse
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
