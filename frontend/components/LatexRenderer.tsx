
import React, { useEffect, useRef, useState } from 'react';
import { Terminal, AlertTriangle, ShieldAlert, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { LATEX_MACROS } from '../latexConfig';

interface LatexRendererProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
  /** Options supplémentaires à passer directement à KaTeX */
  katexOptions?: any;
}

interface ErrorBannerProps {
  error: { message: string; raw: string };
  displayMode: boolean;
}

/**
 * Composant d'affichage d'erreur compact avec bordure rouge et icône d'alerte.
 * Permet l'ouverture d'un panneau de diagnostic complet.
 */
const ErrorBanner: React.FC<ErrorBannerProps> = ({ error, displayMode }) => {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className={`
      flex flex-col items-center gap-2 p-2 rounded-xl border-2 border-red-500/50 bg-red-50 dark:bg-red-950/20 transition-all group/error
      ${displayMode ? 'w-full min-h-[100px] justify-center' : 'inline-flex align-middle'}
    `}>
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <AlertCircle size={16} className="flex-shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-tight">Erreur LaTeX</span>
        
        <button 
          onClick={(e) => { e.stopPropagation(); setShowDebug(!showDebug); }}
          className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-all text-[9px] font-bold underline"
        >
          {showDebug ? 'Masquer détails' : 'Détails'}
        </button>
      </div>
      
      {showDebug && (
        <div className="mt-2 w-full p-4 bg-slate-900 text-white rounded-lg shadow-xl border border-slate-700 animate-in fade-in zoom-in-95 duration-200 text-left overflow-hidden no-print">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-indigo-400 text-[9px] font-bold uppercase tracking-widest">
              <ShieldAlert size={14} /> Diagnostic KaTeX
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-red-950/40 border border-red-900/50 p-2 rounded">
              <span className="text-[8px] font-bold text-red-400 uppercase block mb-1">Exception capturée :</span>
              <p className="text-[10px] font-mono text-red-100 leading-tight">
                {error.message}
              </p>
            </div>
            
            <div>
              <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Code Source :</span>
              <pre className="bg-black/60 p-2 rounded font-mono text-[10px] break-all border border-white/5 whitespace-pre-wrap text-indigo-300">
                {error.raw}
              </pre>
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
            <p className="text-[8px] text-slate-500 italic">
              Vérifiez les macros ou l'équilibre des accolades.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Assainit l'entrée LaTeX pour empêcher les injections HTML ou Script.
 */
const sanitizeLatex = (input: string): string => {
  if (!input || typeof input !== 'string') return "\\text{Formule non valide}";

  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data-url/i,
    /expression\s*\(/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  for (const pattern of maliciousPatterns) {
    if (pattern.test(input)) {
      return "\\text{Formule non valide}";
    }
  }

  const htmlTagStructure = /<([a-z1-9]+)\b[^>]*>|<([a-z1-9]+)\b[^>]*\/>/gi;
  if (htmlTagStructure.test(input)) {
    return "\\text{Formule non valide}";
  }

  return input;
};

/**
 * Rendu KaTeX Professionnel avec support mhchem et macros personnalisées.
 */
export const LatexRenderer: React.FC<LatexRendererProps> = ({ 
  formula, 
  displayMode = false, 
  className = "",
  katexOptions = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<{ message: string; raw: string } | null>(null);

  useEffect(() => {
    const renderMath = () => {
      if (!containerRef.current) return;
      
      setError(null);
      try {
        const katex = (window as any).katex;
        
        if (!katex) {
          throw new Error("Bibliothèque KaTeX introuvable.");
        }
        
        const sanitizedFormula = sanitizeLatex(formula).trim();
        
        if (sanitizedFormula === "\\text{Formule non valide}") {
          throw new Error("Contenu bloqué par le filtre de sécurité.");
        }

        if (sanitizedFormula === "") {
          katex.render("\\text{Expression vide}", containerRef.current, { displayMode: false });
          return;
        }

        // Configuration finale fusionnant les macros globales et les options spécifiques
        const finalOptions = {
          displayMode,
          throwOnError: true, 
          trust: false,
          strict: false,      
          output: "html",     
          macros: { ...LATEX_MACROS, ...((katexOptions as any).macros || {}) },
          minRuleThickness: 0.05, 
          maxExpand: 1000,
          ...katexOptions
        };

        katex.render(sanitizedFormula, containerRef.current, finalOptions);
      } catch (err: any) {
        setError({ 
          message: err.message || "Erreur structurelle", 
          raw: formula 
        });
      }
    };

    renderMath();
  }, [formula, displayMode, katexOptions]);

  return (
    <div className={`relative max-w-full inline-block ${error ? 'w-full' : ''}`}>
      {error ? (
        <ErrorBanner error={error} displayMode={displayMode} />
      ) : (
        <div 
          ref={containerRef} 
          className={`
            ${className} 
            ${displayMode ? 'py-8 px-6 overflow-x-auto overflow-y-hidden text-center block w-full' : 'inline-block'} 
            transition-all duration-300
          `} 
          style={{ fontStyle: 'normal' }}
        />
      )}
    </div>
  );
};
