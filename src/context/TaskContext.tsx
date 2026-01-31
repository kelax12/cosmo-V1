// =============================================================================
// TASK CONTEXT - Compatibilité avec l'ancien code
// Ce fichier réexporte le DataProvider pour la compatibilité ascendante
// Les nouveaux composants devraient utiliser directement les hooks de @/features
// =============================================================================

export { DataProvider as TaskProvider, useTasks } from '@/features/data';

// Réexport des types pour compatibilité
export type { 
  Task, 
  Category, 
  OKRCategory, 
  OKR, 
  KeyResult, 
  Habit, 
  CalendarEvent, 
  TaskList,
  Friend,
  User,
} from '@/shared/types';
