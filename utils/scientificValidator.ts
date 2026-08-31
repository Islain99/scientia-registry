
import { ScientificEntry, ValidationError, LearningLevel } from '../types';
import { LATEX_MACROS } from '../latexConfig';

/**
 * Scientific Validation Engine
 * Ensures absolute rigor in stored data.
 */
export const validateScientificEntry = (entry: Partial<ScientificEntry>): ValidationError[] => {
  const errors: ValidationError[] = [];

  // 1. Structural Validation
  if (!entry.title || entry.title.length < 3) {
    errors.push({ field: 'title', message: "Le titre doit comporter au moins 3 caractères.", severity: 'error' });
  }

  if (!entry.definition || entry.definition.length < 10) {
    errors.push({ field: 'definition', message: "La définition est trop courte pour être rigoureuse.", severity: 'error' });
  }

  // 2. LaTeX Syntax & Safety
  if (entry.statement) {
    const unbalancedBraces = (entry.statement.match(/{/g) || []).length !== (entry.statement.match(/}/g) || []).length;
    if (unbalancedBraces) {
      errors.push({ field: 'statement', message: "Syntaxe LaTeX invalide : accolades non équilibrées.", severity: 'error' });
    }

    // Check for common malicious patterns (redundant with renderer but good for API layer)
    if (/<script|javascript:|on\w+=/i.test(entry.statement)) {
      errors.push({ field: 'statement', message: "Contenu potentiellement malveillant détecté dans l'énoncé.", severity: 'error' });
    }
  }

  // 3. Pedagogical Coherence
  // Example: High-complexity formulas (Riemann, Schrödinger) shouldn't be in Primary level
  const complexTerms = [/\\partial/, /\\Gamma/, /\\nabla/, /\\hbar/, /\\int/];
  if (entry.level === LearningLevel.PRIMARY || entry.level === LearningLevel.SECONDARY) {
    const tooComplex = complexTerms.some(regex => regex.test(entry.statement || ""));
    if (tooComplex && entry.level === LearningLevel.PRIMARY) {
      errors.push({ 
        field: 'level', 
        message: "Complexité mathématique inadaptée pour le niveau Primaire.", 
        severity: 'warning' 
      });
    }
  }

  // 4. Exercise Consistency
  if (entry.exercises) {
    entry.exercises.forEach((ex, idx) => {
      if (!ex.question) errors.push({ field: `exercises[${idx}]`, message: "Question d'exercice manquante.", severity: 'error' });
      if (!ex.solution) errors.push({ field: `exercises[${idx}]`, message: "Solution d'exercice manquante.", severity: 'error' });
      
      // Guided exercises MUST have steps
      if (ex.type === 'guided' && (!ex.steps || ex.steps.length === 0)) {
        errors.push({ field: `exercises[${idx}]`, message: "Un exercice guidé doit obligatoillement contenir des étapes de résolution.", severity: 'error' });
      }
    });
  }

  return errors;
};

/**
 * Helper to normalize scientific notation (simple auto-correction)
 */
export const normalizeScientificText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/(\d)\s*([xX*])\s*(\d)/g, '$1 \\times $3') // Normalize multiplication cross
    .trim();
};
