
/**
 * Registre Professionnel de Macros LaTeX Scientifiques
 * Configuration centralisée pour une notation académique standardisée.
 */
export const LATEX_MACROS: Record<string, string> = {
  // --- Ensembles de nombres ---
  "\\R": "\\mathbb{R}",
  "\\N": "\\mathbb{N}",
  "\\Z": "\\mathbb{Z}",
  "\\Q": "\\mathbb{Q}",
  "\\C": "\\mathbb{C}",

  // --- Dérivées et Différentielles ---
  "\\diff": "\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}",
  "\\pdiff": "\\frac{\\partial #1}{\\partial #2}",
  "\\pdifftwo": "\\frac{\\partial^2 #1}{\\partial #2 \\partial #3}",
  "\\ddiff": "\\frac{\\mathrm{D}#1}{\\mathrm{D}#2}",
  "\\variation": "\\delta #1",

  // --- Opérateurs de Calcul (Intégrales, Sommes, Limites) ---
  "\\dint": "\\int_{#1}^{#2}",
  "\\isum": "\\sum_{#1}^{#2}",
  "\\iprod": "\\prod_{#1}^{#2}",
  "\\limit": "\\lim_{#1 \\to #2}",
  "\\infint": "\\int_{-\\infty}^{\\infty}",

  // --- Vecteurs et Opérateurs Différentiels ---
  "\\grad": "\\nabla",
  "\\divergence": "\\nabla \\cdot",
  "\\curl": "\\nabla \\times",
  "\\laplacian": "\\nabla^2",
  "\\vect": "\\vec{#1}",
  "\\bold": "\\mathbf{#1}",

  // --- Notations Mathématiques Avancées ---
  "\\norm": "\\left\\| #1 \\right\\|",
  "\\abs": "\\left| #1 \\right|",
  "\\set": "\\left\\{ #1 \\right\\}",
  "\\inner": "\\langle #1, #2 \\rangle",
  "\\degree": "^{\\circ}",
  "\\unit": "\\text{ #1}",
  "\\const": "\\text{const.}",
  "\\avg": "\\langle #1 \\rangle",

  // --- Algèbre et Combinatoire ---
  // NOTE: \binom et \frac sont des commandes KaTeX natives — ne pas les redéfinir.
  // Redéfinir \frac provoque une récursion infinie dans KaTeX.

  // --- Systèmes et Alignements ---
  /**
   * Macros pour simplifier les structures multi-lignes.
   * Utilisation: \system{x + y = 2 \\ x - y = 0}
   */
  "\\system": "\\begin{cases} #1 \\end{cases}",
  "\\sys": "\\begin{cases} #1 \\end{cases}",
  "\\cases": "\\begin{cases} #1 \\end{cases}",
  "\\aligned": "\\begin{aligned} #1 \\end{aligned}",
  "\\matrix": "\\begin{pmatrix} #1 \\end{pmatrix}",
  "\\vcol": "\\begin{pmatrix} #1 \\end{pmatrix}",
  "\\array": "\\begin{array}{#1} #2 \\end{array}",
  "\\stack": "\\begin{matrix} #1 \\end{matrix}",

  // --- Physique et Ingénierie ---
  "\\expect": "E\\left[ #1 \\right]",
  "\\fourier": "\\mathcal{F}\\left\\{ #1 \\right\\}",
  "\\hilbert": "\\mathcal{H}\\left\\{ #1 \\right\\}",

  // --- Raccourcis Chimie (mhchem wrap) ---
  "\\sol": "\\text{(aq)}",
  "\\gas": "\\text{(g)}",
  "\\precip": "\\downarrow",
  "\\reaction": "\\ce{#1}"
};

/**
 * Commandes KaTeX natives — ne jamais les redéfinir dans LATEX_MACROS.
 */
const KATEX_NATIVE: Set<string> = new Set([
  'frac', 'binom', 'sqrt', 'sum', 'int', 'prod', 'lim', 'infty', 'cdot',
  'times', 'div', 'pm', 'mp', 'leq', 'geq', 'neq', 'approx', 'equiv',
  'in', 'notin', 'subset', 'supset', 'cup', 'cap', 'emptyset', 'forall',
  'exists', 'neg', 'land', 'lor', 'to', 'gets', 'Rightarrow', 'Leftarrow',
  'Leftrightarrow', 'rightarrow', 'leftarrow', 'leftrightarrow',
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
  'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi', 'rho', 'sigma',
  'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
  'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon',
  'Phi', 'Psi', 'Omega',
  'vec', 'hat', 'bar', 'dot', 'ddot', 'tilde', 'overline', 'underline',
  'overbrace', 'underbrace', 'overset', 'underset', 'stackrel',
  'mathbb', 'mathbf', 'mathit', 'mathrm', 'mathcal', 'mathsf', 'mathtt',
  'text', 'left', 'right', 'big', 'Big', 'bigg', 'Bigg',
  'begin', 'end', 'ce', 'nabla', 'partial', 'hbar', 'ell', 'Re', 'Im',
  'overrightarrow', 'overleftarrow', 'operatorname', 'boldsymbol',
]);

/**
 * Valide une chaîne LaTeX et retourne les macros non reconnues.
 * Vérifie les macros custom non définies dans LATEX_MACROS et non natives KaTeX.
 */
export const validateLatex = (formula: string): string[] => {
  const errors: string[] = [];
  const macroPattern = /\\([a-zA-Z]+)/g;
  const customMacros = new Set(Object.keys(LATEX_MACROS).map(k => k.replace('\\\\', '')));
  let match;
  while ((match = macroPattern.exec(formula)) !== null) {
    const name = match[1];
    if (!KATEX_NATIVE.has(name) && !customMacros.has(`\\${name}`)) {
      errors.push(`Macro non reconnue : \\${name}`);
    }
  }
  return errors;
};
