// =============================================================================
// FEATURES INDEX - Exports centralisés
// =============================================================================

// Auth
export { AuthProvider, useAuth } from './auth';

// Data (compatibilité legacy)
export { DataProvider, useTasks } from './data';

// Tasks
export { 
  useTasks as useTasksQuery, 
  useCreateTask, 
  useUpdateTask, 
  useDeleteTask 
} from './tasks';

// Habits
export { 
  useHabits, 
  useCreateHabit, 
  useUpdateHabit, 
  useDeleteHabit, 
  useToggleHabitCompletion 
} from './habits';

// Categories
export { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory,
  useOKRCategories,
  useCreateOKRCategory,
  useUpdateOKRCategory,
  useDeleteOKRCategory,
} from './categories';

// Events
export { 
  useEvents, 
  useCreateEvent, 
  useUpdateEvent, 
  useDeleteEvent 
} from './events';

// OKRs
export { 
  useOKRs, 
  useCreateOKR, 
  useUpdateOKR, 
  useDeleteOKR, 
  useUpdateKeyResult 
} from './okrs';

// Lists
export { 
  useLists, 
  useCreateList, 
  useUpdateList, 
  useDeleteList,
  useAddTaskToList,
  useRemoveTaskFromList,
} from './lists';
