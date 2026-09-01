# Rapport d'analyse — Scientia Registry

**Dépôt :** `Islain99/scientia-registry`  
**Date d'analyse :** 10 août 2026  
**Fichiers examinés :** 18 fichiers (App.tsx, types.ts, constants.tsx, services/geminiService.ts, components/\*, utils/scientificValidator.ts, latexConfig.ts, index.html, package.json, vite.config.ts)

---

## 1. Vue d'ensemble

Scientia Registry est une application web monopage (SPA) permettant de consulter, créer et explorer des formules et théorèmes scientifiques, avec support LaTeX, système de rôles (RBAC) et assistance par IA générative (Google Gemini). La stack technique est moderne et bien choisie pour ce type d'outil pédagogique.

**Stack :**
- React 19 + TypeScript (strict mode)
- Vite 6 (build tool)
- Tailwind CSS via CDN
- KaTeX 0.16 via CDN (rendu LaTeX)
- mhchem via CDN (chimie)
- Google Gemini API (`@google/genai`)
- Lucide React (icônes)
- État local uniquement (localStorage) — aucun backend

---

## 2. Architecture

### Structure des fichiers

```
scientia-registry/
├── App.tsx                     # Composant racine + état global
├── types.ts                    # Tous les types, enums, interfaces
├── constants.tsx               # Données initiales (INITIAL_ENTRIES)
├── latexConfig.ts              # Macros KaTeX personnalisées
├── index.html                  # Point d'entrée HTML
├── index.tsx                   # Point d'entrée React
├── components/
│   ├── Dashboard.tsx           # Vue analytique
│   ├── EntryCard.tsx           # Carte résumée d'une entrée
│   ├── EntryDetails.tsx        # Vue détaillée avec onglets
│   ├── EntryModal.tsx          # Formulaire création/édition
│   ├── ErrorBoundary.tsx       # Gestion des erreurs React
│   ├── LatexRenderer.tsx       # Rendu KaTeX avec sécurité
│   ├── LifecycleManager.tsx    # Gestion du cycle de vie d'une entrée
│   ├── NotificationSystem.tsx  # Toasts/alertes
│   ├── RoleGuard.tsx           # Garde de permission RBAC
│   └── Sidebar.tsx             # Navigation latérale
├── services/
│   └── geminiService.ts        # Appels API Gemini
└── utils/
    └── scientificValidator.ts  # Validation des entrées
```

L'architecture est **plate et monolithique** : tout l'état global réside dans `App.tsx` via `useState`, sans Context API (sauf pour les notifications), sans Redux, sans Zustand. C'est acceptable à l'échelle actuelle mais deviendra difficile à maintenir au-delà d'une dizaine de concepts ou de fonctionnalités.

### Flux de données

```
App.tsx (état central)
  └─ Sidebar (filtres + navigation)
  └─ EntryCard[] (liste filtrée)
  └─ EntryDetails (vue détaillée)
       ├─ LatexRenderer
       ├─ LifecycleManager
       └─ geminiService (IA)
  └─ EntryModal (création/édition)
       └─ geminiService (génération IA)
  └─ Dashboard (statistiques)
```

---

## 3. Bugs critiques (bloquants)

### 🔴 BUG 1 — `process.env.API_KEY` invalide dans Vite

**Fichier :** `services/geminiService.ts` (lignes 9, 45, 81)

```ts
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```

Dans un projet Vite, `process.env` n'est pas disponible à l'exécution. Vite utilise `import.meta.env`. De plus, les variables doivent être préfixées `VITE_` pour être exposées au bundle client.

**Impact :** Toutes les fonctionnalités IA (explication, génération, suggestions) échouent silencieusement avec `undefined` comme clé API.

**Correction :**
```ts
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
```
Et créer un fichier `.env` :
```
VITE_GEMINI_API_KEY=ta_clé_ici
```

---

### 🔴 BUG 2 — Nom de modèle Gemini inexistant

**Fichier :** `services/geminiService.ts` (lignes 26, 63, 92)

```ts
model: "gemini-3-flash-preview",
```

Ce modèle n'existe pas. Les noms valides sont `"gemini-1.5-flash"`, `"gemini-2.0-flash"`, `"gemini-2.5-flash"`, etc. Chaque appel à l'API retournera une erreur 404.

**Correction :** Remplacer par un modèle valide, ex :
```ts
model: "gemini-2.0-flash",
```

---

### 🔴 BUG 3 — `index.tsx` chargé deux fois dans `index.html`

**Fichier :** `index.html` (fin du `<body>`)

```html
<script type="module" src="index.tsx"></script>
<script type="module" src="/index.tsx"></script>
```

Le script d'entrée React est déclaré deux fois. Cela provoque un double-montage de l'application, avec des effets de bord imprévisibles (double rendu, doubles appels `useEffect`, doublons d'événements).

**Correction :** Supprimer la première ligne dupliquée et ne garder que :
```html
<script type="module" src="/index.tsx"></script>
```

---

### 🔴 BUG 4 — Les entrées créées ou modifiées ne persistent pas après rechargement

**Fichier :** `App.tsx` (ligne 24)

```ts
const [entries, setEntries] = useState<ScientificEntry[]>(INITIAL_ENTRIES);
```

L'état `entries` est initialisé depuis `INITIAL_ENTRIES` (constante hardcodée), pas depuis `localStorage`. Ainsi, toute entrée créée, éditée ou supprimée par l'utilisateur disparaît au rechargement de la page. Seuls les favoris, la progression et le thème persistent.

**Correction :** Initialiser depuis `localStorage` avec fallback :
```ts
const [entries, setEntries] = useState<ScientificEntry[]>(() => {
  const saved = localStorage.getItem('scientia_entries');
  return saved ? JSON.parse(saved) : INITIAL_ENTRIES;
});

useEffect(() => {
  localStorage.setItem('scientia_entries', JSON.stringify(entries));
}, [entries]);
```

---

### 🔴 BUG 5 — Fichier CSS manquant

**Fichier :** `index.html` (ligne 57)

```html
<link rel="stylesheet" href="/index.css">
```

Le fichier `index.css` n'existe pas dans le dépôt. En mode développement Vite, cela génère une erreur 404 dans la console. En production, les styles custom (scrollbar, print, fonts) pourraient partiellement manquer.

---

## 4. Problèmes de sécurité

### 🟠 SEC-1 — RBAC contournable par l'utilisateur lui-même

**Fichier :** `App.tsx` (zone header)

Le switcher de rôle (Étudiant / Enseignant / Admin / Invité) est accessible directement dans l'interface, sans aucune authentification. N'importe qui peut se passer en mode Admin et accéder aux fonctions réservées (création, suppression, validation, références académiques).

Le système RBAC est donc **purement cosmétique** en l'état. Il simule bien les comportements par rôle mais n'offre aucune vraie protection.

**Recommandation à moyen terme :** Implémenter une authentification réelle (ex: Supabase Auth, Firebase Auth) et stocker le rôle côté serveur, non côté client.

### 🟡 SEC-2 — Clé API Gemini exposée côté client

Même une fois corrigé le bug `process.env`, une clé API dans `import.meta.env.VITE_*` est **incluse dans le bundle JavaScript** et visible par n'importe quel utilisateur qui inspecte le code source du site déployé.

**Recommandation :** Proxier les appels Gemini via une fonction serverless (Vercel Function, Netlify Function, Cloudflare Worker) qui détient la clé côté serveur.

### 🟡 SEC-3 — `validateLatex` est une fonction morte

**Fichier :** `latexConfig.ts` (ligne 59)

```ts
export const validateLatex = (formula: string): string[] => {
  const customMacroPattern = /\\[a-zA-Z]+/g;
  const foundMacros = formula.match(customMacroPattern) || [];
  return []; // ← retourne toujours un tableau vide, sans erreurs
};
```

La fonction détecte les macros mais retourne toujours `[]` sans aucune logique de validation réelle. Elle n'est d'ailleurs jamais appelée dans le codebase. C'est du code mort.

---

## 5. Qualité du code

### 🟠 CODE-1 — `validateScientificEntry` importé mais jamais appelé

**Fichier :** `App.tsx` (ligne 12) et `EntryModal.tsx`

```ts
import { validateScientificEntry } from './utils/scientificValidator'; // App.tsx
```

Le validateur est importé dans `App.tsx` mais `handleSaveEntry` ne l'appelle jamais. Le formulaire dans `EntryModal.tsx` soumet directement via `handleSubmit` sans validation. Résultat : des entrées incomplètes ou avec du LaTeX invalide peuvent être enregistrées.

**Correction :**
```ts
const handleSaveEntry = (newEntry: ScientificEntry) => {
  const errors = validateScientificEntry(newEntry);
  const criticalErrors = errors.filter(e => e.severity === 'error');
  if (criticalErrors.length > 0) {
    notify({ type: 'error', title: 'Validation échouée', message: criticalErrors[0].message });
    return;
  }
  // ... suite
};
```

### 🟠 CODE-2 — Génération d'ID non fiable

**Fichier :** `EntryModal.tsx` (ligne 88)

```ts
id: formData.id || Math.random().toString(36).substr(2, 9),
```

`Math.random()` n'est pas garanti unique et peut produire des collisions. De plus, `substr` est déprécié (utiliser `substring`).

**Correction :**
```ts
id: formData.id || crypto.randomUUID(),
```

### 🟡 CODE-3 — Typo dans les données initiales

**Fichier :** `constants.tsx` (entrée id='8')

```ts
subDiscipline: 'Thermodyamique Chimique', // ← manque le 'n'
```

Doit être `'Thermodynamique Chimique'`.

### 🟡 CODE-4 — Formule de l'Intégrale de Gauss incorrecte dans les données

**Fichier :** `constants.tsx` (entrée id='9')

```ts
statement: "\\infint e^{-x^2} \\mathrm{d}x = \\sqrt{\\pi}",
```

Le macro `\infint` est défini comme `\int_{-\infty}^{\infty}` dans `latexConfig.ts`, donc le rendu sera : `∫_{-∞}^{∞} e^{-x²} dx = √π`. C'est correct mathématiquement. Cependant la définition dit "intégrale sur toute la droite réelle" — c'est cohérent. Pas d'erreur mathématique ici, mais c'est un exemple de dépendance aux macros internes qui peut poser problème si le macro n'est pas chargé.

### 🟡 CODE-5 — `\binom` et `\frac` redéfinis dans les macros

**Fichier :** `latexConfig.ts` (lignes 49, 52)

```ts
"\\binom": "\\begin{pmatrix} #1 \\\\ #2 \\end{pmatrix}",
"\\frac": "\\frac{#1}{#2}",
```

`\binom` et `\frac` sont des commandes natives de KaTeX. Les redéfinir dans les macros peut créer des comportements inattendus ou des boucles infinies (une macro `\frac` qui appelle `\frac`). Supprimer ces deux entrées.

### 🟡 CODE-6 — La recherche ne couvre que le titre

**Fichier :** `App.tsx` (filteredEntries, ligne 133)

```ts
const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase());
```

La recherche ne porte que sur le titre. Les mots-clés (`keywords`), la définition et la discipline ne sont pas indexés. Un utilisateur cherchant "Newton" ne trouvera pas la "Loi de la Gravitation Universelle" (dont le titre ne contient pas "Newton").

**Correction suggérée :**
```ts
const q = searchQuery.toLowerCase();
const matchesSearch = 
  entry.title.toLowerCase().includes(q) ||
  entry.keywords.some(k => k.toLowerCase().includes(q)) ||
  entry.definition.toLowerCase().includes(q);
```

### 🟡 CODE-7 — Pas de pagination ni de virtualisation

Le composant retourne toutes les entrées filtrées dans une grille CSS sans limitation. À quelques dizaines d'entrées ce sera fluide, mais à l'échelle (centaines de formules), les performances se dégraderont. Envisager `react-window` ou une pagination simple.

### 🟡 CODE-8 — L'explication IA n'est pas rendue en LaTeX

**Fichier :** `EntryDetails.tsx` (onglet IA)

```tsx
<div className="... whitespace-pre-wrap font-medium">
  {aiExplanation}
</div>
```

Le texte retourné par Gemini contient probablement des formules LaTeX (l'instruction système demande explicitement d'utiliser LaTeX). Ces formules sont affichées en texte brut (ex: `$F = ma$`) plutôt que rendues par `LatexRenderer`.

### 🟡 CODE-9 — Boutons sans action dans le Dashboard

**Fichier :** `Dashboard.tsx`

- "Voir tous les journaux" (ligne ~168) : bouton sans `onClick`
- "Lancer une génération assistée" (ligne ~185) : bouton sans `onClick`
- Le badge "+12%" du KPI "Total Concepts" est hardcodé, non calculé

### 🟡 CODE-10 — `User` interface jamais utilisée

**Fichier :** `types.ts` (ligne 80)

L'interface `User` (id, name, role, favorites, progress) est définie mais jamais instanciée ni utilisée dans l'application. L'utilisateur est uniquement représenté par `userRole: UserRole`.

### 🟡 CODE-11 — Suggestions IA basées sur les titres, pas les IDs

**Fichier :** `EntryDetails.tsx` + `geminiService.ts`

```ts
const suggestedEntries = allEntries.filter(e => aiSuggestions.includes(e.title));
```

`suggestRelatedConcepts` retourne des titres (strings), et le filtre cherche dans `e.title`. Si un titre contient des caractères spéciaux, des apostrophes, ou si l'IA retourne une variante légèrement différente du titre, le filtrage échoue silencieusement. Utiliser les IDs est plus robuste.

---

## 6. Points positifs

Ces aspects sont bien conçus et constituent une base solide :

**Architecture**
- Séparation claire des responsabilités : types centralisés, service IA isolé, validateur indépendant
- `ErrorBoundary` correctement positionné au niveau racine
- `NotificationProvider` via Context API, proprement découplé

**Sécurité du rendu LaTeX**
- `sanitizeLatex()` dans `LatexRenderer.tsx` filtre les patterns XSS (`<script>`, `javascript:`, `on*=`, `<iframe>`, etc.) avant tout rendu KaTeX — bonne pratique
- `throwOnError: true` dans KaTeX + affichage d'un `ErrorBanner` au lieu d'un crash silencieux

**RBAC**
- Modèle de permissions bien structuré (`ROLE_PERMISSIONS` dans `types.ts`)
- `RoleGuard` avec double mode (par rôle exact ou par permission) est flexible et réutilisable

**Système de macros LaTeX**
- `latexConfig.ts` centralise les macros scientifiques (dérivées, intégrales, vecteurs, systèmes, chimie)
- Le macro `\reaction` wrappant `\ce{}` de mhchem est une bonne idée pour unifier la notation chimique

**Validation pédagogique**
- `validateScientificEntry` couvre la cohérence structurelle (titre, définition), syntaxe LaTeX (accolades équilibrées), et cohérence pédagogique (complexité vs niveau)
- La vérification des exercices guidés (steps obligatoires) est pertinente

**UX**
- Dark mode persistant avec Tailwind `dark:` classes
- Export LaTeX fonctionnel (génère un `.tex` valide avec les bons packages)
- `LifecycleManager` pour la gestion du cycle de vie (draft → review → active)
- Animations Tailwind (`animate-in`, `fade-in`, `slide-in-from-*`) cohérentes

---

## 7. Recommandations prioritaires

### Urgentes (à corriger avant tout déploiement)

| # | Problème | Fichier | Action |
|---|----------|---------|--------|
| 1 | `process.env.API_KEY` → `import.meta.env.VITE_GEMINI_API_KEY` | `geminiService.ts` | Correction immédiate |
| 2 | Modèle Gemini inexistant (`gemini-3-flash-preview`) | `geminiService.ts` | Remplacer par `gemini-2.0-flash` |
| 3 | Double chargement de `index.tsx` | `index.html` | Supprimer la ligne dupliquée |
| 4 | Entries non persistées (state non sauvegardé) | `App.tsx` | Ajouter `localStorage` sync |
| 5 | `index.css` manquant | `index.html` | Créer le fichier ou supprimer le lien |

### Court terme (qualité)

| # | Problème | Action |
|---|----------|--------|
| 6 | Validation ignorée au save | Appeler `validateScientificEntry` dans `handleSaveEntry` |
| 7 | Recherche limitée au titre | Étendre à `keywords` et `definition` |
| 8 | ID généré avec `Math.random()` | Remplacer par `crypto.randomUUID()` |
| 9 | Macros `\binom` et `\frac` redéfinies | Supprimer de `latexConfig.ts` |
| 10 | Rendu IA en plain text | Passer l'explication par `LatexRenderer` |

### Moyen terme (architecture)

| # | Recommandation |
|---|----------------|
| 11 | Ajouter React Router pour des URLs partageables (`/entry/:id`) |
| 12 | Déplacer l'état global vers Context API ou Zustand |
| 13 | Proxy les appels Gemini via une fonction serverless |
| 14 | Ajouter Vitest + Testing Library pour les composants clés |
| 15 | Ajouter ESLint + Prettier pour la cohérence du code |
| 16 | Pagination ou virtualisation de la grille d'entrées |

---

## 8. Résumé des métriques

| Catégorie | Évaluation |
|-----------|------------|
| Architecture globale | ✅ Bien structurée pour la taille actuelle |
| Qualité TypeScript | ✅ Bonne utilisation des enums et interfaces |
| Sécurité RBAC | ⚠️ Fonctionnel mais contournable (pas d'auth) |
| Sécurité LaTeX | ✅ Sanitization correcte |
| Fonctionnalités IA | 🔴 Totalement non fonctionnelles en l'état (2 bugs critiques) |
| Persistance des données | 🔴 Entries perdues au rechargement |
| Tests | 🔴 Aucun test présent |
| Accessibilité | ⚠️ Non évaluée (pas de ARIA labels visibles) |
| Performance | ⚠️ Acceptable maintenant, risque à l'échelle |

---

*Rapport généré par analyse statique du dépôt GitHub `Islain99/scientia-registry` — branche `main`.*
