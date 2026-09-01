
import { Discipline, LearningLevel, ContentType, ScientificEntry, EntryStatus, EntryOrigin } from './types';

export const INITIAL_ENTRIES: ScientificEntry[] = [
  {
    id: '1',
    title: 'Théorème de Pythagore',
    discipline: Discipline.MATHEMATICS,
    subDiscipline: 'Géométrie Euclidienne',
    level: LearningLevel.SECONDARY,
    type: ContentType.THEOREM,
    definition: "Dans un triangle rectangle, le carré de la longueur de l'hypoténuse est égal à la somme des carrés des longueurs des deux autres côtés.",
    statement: "a^2 + b^2 = c^2",
    context: "Utilisé pour calculer des distances dans un espace euclidien bidimensionnel.",
    examples: [
      "Calcul de la diagonale d'un écran de 15x20 cm.",
      "Vérification de l'orthogonalité d'un mur lors d'une construction."
    ],
    exercises: [
      {
        id: 'ex1-1',
        type: 'guided',
        question: "Soit un triangle rectangle ABC en A. Si AB = 3 et AC = 4, calculez BC.",
        steps: [
          "Identifiez l'hypoténuse (BC).",
          "Appliquez la formule: $BC^2 = AB^2 + AC^2$",
          "Remplacez les valeurs: $BC^2 = 3^2 + 4^2 = 9 + 16 = 25$",
          "Extrayez la racine carrée."
        ],
        solution: "BC = 5",
        difficulty: 'easy'
      }
    ],
    keywords: ['Triangle', 'Hypoténuse', 'Géométrie'],
    references: ['Éléments d\'Euclide, Livre I'],
    relatedIds: ['3'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastModifiedBy: 'admin_sys',
    status: EntryStatus.ACTIVE,
    origin: EntryOrigin.MANUAL,
    version: 1
  },
  {
    id: '9',
    title: 'Intégrale de Gauss',
    discipline: Discipline.MATHEMATICS,
    subDiscipline: 'Analyse Mathématique',
    level: LearningLevel.UNIVERSITY,
    type: ContentType.FORMULA,
    definition: "L'intégrale de la fonction gaussienne sur toute la droite réelle. C'est un résultat fondamental en statistique et en théorie des probabilités.",
    statement: "\\infint e^{-x^2} \\mathrm{d}x = \\sqrt{\\pi}",
    context: "Utilisée pour normaliser la loi normale (courbe en cloche) et dans de nombreux domaines de la physique (diffusion, chaleur).",
    examples: [
      "Calcul de la constante de normalisation d'une distribution normale.",
      "Calcul des amplitudes de transition en mécanique quantique."
    ],
    exercises: [
      {
        id: 'ex9-1',
        type: 'autonomous',
        question: "Calculez l'intégrale de Gauss pour $e^{-ax^2}$ où $a > 0$.",
        solution: "En effectuant le changement de variable $u = \\sqrt{a}x$, on obtient $\\sqrt{\\pi/a}$.",
        difficulty: 'hard'
      }
    ],
    keywords: ['Gauss', 'Analyse', 'Intégrale', 'Probabilités'],
    references: ['Euler, L. (1729)', 'Gauss, C.F. (1809)'],
    relatedIds: ['6'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastModifiedBy: 'admin_sys',
    status: EntryStatus.ACTIVE,
    origin: EntryOrigin.MANUAL,
    version: 1
  },
  {
    id: '8',
    title: 'Synthèse de l\'Eau',
    discipline: Discipline.CHEMISTRY,
    subDiscipline: 'Thermodyamique Chimique',
    level: LearningLevel.SECONDARY,
    type: ContentType.EQUATION,
    definition: "Réaction d'oxydo-réduction exothermique produisant de l'eau à partir de dihydrogène et de dioxygène.",
    statement: "\\reaction{2H2 + O2 -> 2H2O}",
    context: "Réaction fondamentale utilisée dans les piles à combustible pour produire de l'énergie propre.",
    examples: [
      "Combustion du dihydrogène dans un moteur à fusée.",
      "Production d'électricité dans une cellule de propulsion spatiale."
    ],
    exercises: [
      {
        id: 'ex8-1',
        type: 'guided',
        question: "Équilibrez la réaction de combustion du méthane.",
        steps: [
          "Écrivez les réactifs : CH4 + O2.",
          "Écrivez les produits : CO2 + H2O.",
          "Comptez les atomes de Carbone, puis d'Hydrogène, puis d'Oxygène."
        ],
        solution: "\\ce{CH4 + 2O2 -> CO2 + 2H2O}",
        difficulty: 'medium'
      }
    ],
    keywords: ['Chimie', 'Réaction', 'H2O', 'Mhchem'],
    references: ['Principes de Chimie Moderne'],
    relatedIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastModifiedBy: 'admin_sys',
    status: EntryStatus.ACTIVE,
    origin: EntryOrigin.MANUAL,
    version: 1
  },
  {
    id: '2',
    title: 'Loi de la Gravitation Universelle',
    discipline: Discipline.PHYSICS,
    subDiscipline: 'Mécanique Classique',
    level: LearningLevel.COLLEGE,
    type: ContentType.FORMULA,
    definition: "Deux corps massifs s'attirent avec une force proportionnelle au produit de leurs masses et inversement proportionnelle au carré de la distance qui les sépare.",
    statement: "F = G \\frac{m_1 m_2}{r^2}",
    context: "Indispensable en astrophysique pour calculer les orbites planétaires.",
    examples: [
      "Calcul de la force d'attraction entre la Terre et la Lune.",
      "Explication de la chute libre d'un objet à la surface terrestre."
    ],
    exercises: [
      {
        id: 'ex2-1',
        type: 'autonomous',
        question: "Comment la force varie-t-elle si la distance entre deux corps est doublée ?",
        solution: "La force est divisée par 4 (loi en carré inverse).",
        difficulty: 'medium'
      }
    ],
    keywords: ['Gravité', 'Newton', 'Masse'],
    references: ['Philosophiae Naturalis Principia Mathematica (1687)'],
    relatedIds: ['4'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastModifiedBy: 'admin_sys',
    status: EntryStatus.ACTIVE,
    origin: EntryOrigin.MANUAL,
    version: 1
  },
  {
    id: '7',
    title: 'Système Linéaire 2x2',
    discipline: Discipline.MATHEMATICS,
    subDiscipline: 'Algèbre Linéaire',
    level: LearningLevel.SECONDARY,
    type: ContentType.EQUATION,
    definition: "Un ensemble d'équations linéaires partageant les mêmes variables. La solution est le point d'intersection des droites correspondantes.",
    statement: "\\system{ax + by = e \\\\ cx + dy = f}",
    context: "Utilisé pour modéliser des problèmes de collision, d'équilibre économique ou de mélanges chimiques.",
    examples: [
      "Détermination du point de rencontre de deux mobiles.",
      "Calcul des quantités de réactifs dans une solution tampon."
    ],
    exercises: [
      {
        id: 'ex7-1',
        type: 'guided',
        question: "Résolvez le système suivant : \\system{x + y = 10 \\\\ x - y = 2}",
        steps: [
          "Additionnez les deux lignes pour éliminer y.",
          "Obtenez 2x = 12 donc x = 6.",
          "Substituez x dans la première ligne pour trouver y."
        ],
        solution: "x = 6, y = 4",
        difficulty: 'medium'
      }
    ],
    keywords: ['Algèbre', 'Système', 'Linéaire'],
    references: ['Algèbre de base'],
    relatedIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastModifiedBy: 'admin_sys',
    status: EntryStatus.ACTIVE,
    origin: EntryOrigin.MANUAL,
    version: 1
  }
];
