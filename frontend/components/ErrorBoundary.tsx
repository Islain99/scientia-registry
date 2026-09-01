
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary
 * Prevents application crash and provides recovery options.
 */
// Fix: Extending the named Component export directly to ensure proper typing of base class members.
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught scientific application error:", error, errorInfo);
    // Here we would typically log to an external audit service
  }

  // Fix: setState is now correctly inherited from Component base class
  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="text-red-600 dark:text-red-400" size={40} />
            </div>
            
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Anomalie Critique Système</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
              Une erreur d'exécution imprévue a interrompu le processus. L'intégrité de la session actuelle est compromise.
            </p>

            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-8 text-left border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Diagnostic technique</span>
              <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 break-words">
                {this.state.error?.name}: {this.state.error?.message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                <RefreshCw size={18} /> Réinitialiser
              </button>
              <a 
                href="/"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <Home size={18} /> Accueil
              </a>
            </div>
            
            <p className="mt-8 text-[10px] text-slate-400 italic">Scientia Kernel v2.0.1 - Rapport d'incident généré automatiquement.</p>
          </div>
        </div>
      );
    }

    // Fix: props is correctly inherited and identified from the Component base class
    return this.props.children;
  }
}
