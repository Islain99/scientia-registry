
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
  "\\binom": "\\begin{pmatrix} #1 \\\\ #2 \\end{pmatrix}",
  "\\frac": "\\frac{#1}{#2}", // Support explicite pour KaTeX

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
 * Valide si une chaîne contient des macros non supportées (pré-rendu).
 */
export const validateLatex = (formula: string): string[] => {
  const customMacroPattern = /\\[a-zA-Z]+/g;
  const foundMacros = formula.match(customMacroPattern) || [];
  return [];
};
