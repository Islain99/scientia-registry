
export enum Discipline {
  MATHEMATICS = 'Mathématiques',
  PHYSICS = 'Physique',
  CHEMISTRY = 'Chimie',
  BIOLOGY = 'Biologie',
  COMPUTER_SCIENCE = 'Informatique',
  GEOGRAPHY = 'Géographie scientifique',
  GEOLOGY = 'Géologie',
  STATISTICS = 'Statistiques',
  ENGINEERING = 'Sciences de l’ingénieur'
}

export enum LearningLevel {
  PRIMARY = 'Primaire',
  SECONDARY = 'Secondaire',
  COLLEGE = 'Collégial',
  UNIVERSITY = 'Universitaire',
  SPECIALIZED = 'Formations spécialisées'
}

export enum DetailLevel {
  SIMPLE = 'Simple',
  DETAILED = 'Détaillé',
  EXPERT = 'Expert'
}

export enum ContentType {
  FORMULA = 'Formule',
  EQUATION = 'Équation',
  THEOREM = 'Théorème',
  HYPOTHESIS = 'Hypothèse',
  DEFINITION = 'Définition'
}

export enum ProgressStatus {
  NOT_STARTED = 0,
  IN_PROGRESS = 1,
  UNDERSTOOD = 2
}

export enum EntryStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum EntryOrigin {
  MANUAL = 'manual',
  AI = 'ai'
}

/**
 * RBAC System Enums
 */
export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  GUEST = 'guest'
}

export enum Permission {
  CONTENT_READ = 'content:read',
  CONTENT_CREATE = 'content:create',
  CONTENT_UPDATE = 'content:update',
  CONTENT_DELETE = 'content:delete',
  USER_MANAGE = 'user:manage',
  SYSTEM_AUDIT = 'system:audit',
  AI_ADVANCED = 'ai:advanced'
}

export interface Exercise {
  id: string;
  type: 'guided' | 'autonomous';
  question: string;
  steps?: string[];
  solution: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ScientificEntry {
  id: string;
  title: string;
  discipline: Discipline;
  subDiscipline?: string;
  level: LearningLevel;
  type: ContentType;
  definition: string;
  statement: string; // LaTeX formatted
  context: string;
  examples: string[]; 
  exercises: Exercise[];
  keywords: string[];
  references: string[];
  relatedIds?: string[];
  lastModifiedBy?: string;
  createdAt: number;
  updatedAt: number;
  status: EntryStatus;
  origin: EntryOrigin;
  version: number;
}

export interface UserProgress {
  status: ProgressStatus;
  lastUpdated: number;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  favorites: string[]; // Entry IDs
  progress: Record<string, UserProgress>; // Entry ID -> Progress Info
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.TEACHER]: [
    Permission.CONTENT_READ,
    Permission.CONTENT_CREATE,
    Permission.CONTENT_UPDATE,
    Permission.AI_ADVANCED
  ],
  [UserRole.STUDENT]: [
    Permission.CONTENT_READ
  ],
  [UserRole.GUEST]: [
    Permission.CONTENT_READ
  ]
};

/**
 * Validation & Error Handling Types
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface SystemNotification {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  duration?: number;
}
