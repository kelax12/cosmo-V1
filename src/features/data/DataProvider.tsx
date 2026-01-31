// =============================================================================
// DATA PROVIDER - Couche de compatibilité avec l'ancien TaskContext
// Permet une migration progressive des composants vers les nouveaux hooks
// =============================================================================

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/features/tasks';
import { useHabits, useCreateHabit, useUpdateHabit, useDeleteHabit, useToggleHabitCompletion } from '@/features/habits';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useOKRCategories, useCreateOKRCategory, useUpdateOKRCategory, useDeleteOKRCategory } from '@/features/categories';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/features/events';
import { useOKRs, useCreateOKR, useUpdateOKR, useDeleteOKR, useUpdateKeyResult } from '@/features/okrs';
import { useLists, useCreateList, useUpdateList, useDeleteList, useAddTaskToList, useRemoveTaskFromList } from '@/features/lists';
import type { Task, Habit, Category, OKRCategory, CalendarEvent, OKR, TaskList, Friend } from '@/shared/types';

// Interface compatible avec l'ancien TaskContext
interface DataContextType {
  // Auth
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  toggleBookmark: (id: string) => void;
  
  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // OKR Categories
  okrCategories: OKRCategory[];
  addOKRCategory: (category: Omit<OKRCategory, 'id'>) => void;
  updateOKRCategory: (id: string, updates: Partial<OKRCategory>) => void;
  deleteOKRCategory: (id: string) => void;
  
  // OKRs
  okrs: OKR[];
  addOKR: (okr: Omit<OKR, 'id'>) => void;
  updateOKR: (id: string, updates: Partial<OKR>) => void;
  deleteOKR: (id: string) => void;
  updateKeyResult: (okrId: string, keyResultId: string, value: number) => void;
  
  // Habits
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (id: string, date: string) => void;
  
  // Events
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  
  // Lists
  lists: TaskList[];
  addList: (list: Omit<TaskList, 'id' | 'taskIds'>) => void;
  updateList: (id: string, updates: Partial<TaskList>) => void;
  deleteList: (id: string) => void;
  addTaskToList: (taskId: string, listId: string) => void;
  removeTaskFromList: (taskId: string, listId: string) => void;
  
  // Friends & Settings (mock)
  friends: Friend[];
  shareTask: (taskId: string, userId: string, permission: string) => void;
  sendFriendRequest: (email: string) => void;
  colorSettings: Record<string, string>;
  favoriteColors: string[];
  priorityRange: { min: number; max: number };
  updateUserSettings: (settings: any) => void;
  isPremium: () => boolean;
  watchAd: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  
  // Tasks
  const { tasks } = useTasks();
  const createTask = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  
  // Habits
  const { habits } = useHabits();
  const createHabit = useCreateHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const toggleHabitCompletionFn = useToggleHabitCompletion();
  
  // Categories
  const { categories } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  
  // OKR Categories
  const { okrCategories } = useOKRCategories();
  const createOKRCategory = useCreateOKRCategory();
  const updateOKRCategoryMutation = useUpdateOKRCategory();
  const deleteOKRCategoryMutation = useDeleteOKRCategory();
  
  // Events
  const { events } = useEvents();
  const createEvent = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();
  
  // OKRs
  const { okrs } = useOKRs();
  const createOKR = useCreateOKR();
  const updateOKRMutation = useUpdateOKR();
  const deleteOKRMutation = useDeleteOKR();
  const updateKeyResultMutation = useUpdateKeyResult();
  
  // Lists
  const { lists } = useLists();
  const createList = useCreateList();
  const updateListMutation = useUpdateList();
  const deleteListMutation = useDeleteList();
  const addTaskToListMutation = useAddTaskToList();
  const removeTaskFromListMutation = useRemoveTaskFromList();

  const value = useMemo<DataContextType>(() => ({
    // Auth
    user: auth.user,
    loading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    isDemo: auth.isDemo,
    login: auth.login,
    register: auth.register,
    loginWithGoogle: auth.loginWithGoogle,
    logout: auth.logout,
    
    // Tasks
    tasks,
    addTask: (task) => createTask.mutate(task),
    updateTask: (id, updates) => updateTaskMutation.mutate({ id, updates }),
    deleteTask: (id) => deleteTaskMutation.mutate(id),
    toggleComplete: (id) => {
      const task = tasks.find(t => t.id === id);
      if (task) {
        updateTaskMutation.mutate({ 
          id, 
          updates: { 
            completed: !task.completed, 
            completedAt: !task.completed ? new Date().toISOString() : undefined 
          } 
        });
      }
    },
    toggleBookmark: (id) => {
      const task = tasks.find(t => t.id === id);
      if (task) {
        updateTaskMutation.mutate({ id, updates: { bookmarked: !task.bookmarked } });
      }
    },
    
    // Categories
    categories,
    addCategory: (cat) => createCategory.mutate(cat),
    updateCategory: (id, updates) => updateCategoryMutation.mutate({ id, updates }),
    deleteCategory: (id) => deleteCategoryMutation.mutate(id),
    
    // OKR Categories
    okrCategories,
    addOKRCategory: (cat) => createOKRCategory.mutate(cat),
    updateOKRCategory: (id, updates) => updateOKRCategoryMutation.mutate({ id, updates }),
    deleteOKRCategory: (id) => deleteOKRCategoryMutation.mutate(id),
    
    // OKRs
    okrs,
    addOKR: (okr) => createOKR.mutate(okr),
    updateOKR: (id, updates) => updateOKRMutation.mutate({ id, updates }),
    deleteOKR: (id) => deleteOKRMutation.mutate(id),
    updateKeyResult: (okrId, keyResultId, value) => updateKeyResultMutation.mutate({ okrId, keyResultId, value }),
    
    // Habits
    habits,
    addHabit: (habit) => createHabit.mutate(habit),
    updateHabit: (id, updates) => updateHabitMutation.mutate({ id, updates }),
    deleteHabit: (id) => deleteHabitMutation.mutate(id),
    toggleHabitCompletion: (id, date) => toggleHabitCompletionFn(id, date),
    
    // Events
    events,
    addEvent: (event) => createEvent.mutate(event),
    updateEvent: (id, updates) => updateEventMutation.mutate({ id, updates }),
    deleteEvent: (id) => deleteEventMutation.mutate(id),
    
    // Lists
    lists,
    addList: (list) => createList.mutate(list),
    updateList: (id, updates) => updateListMutation.mutate({ id, updates }),
    deleteList: (id) => deleteListMutation.mutate(id),
    addTaskToList: (taskId, listId) => addTaskToListMutation.mutate({ listId, taskId }),
    removeTaskFromList: (taskId, listId) => removeTaskFromListMutation.mutate({ listId, taskId }),
    
    // Mock data for compatibility
    friends: [],
    shareTask: () => {},
    sendFriendRequest: () => {},
    colorSettings: {},
    favoriteColors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
    priorityRange: { min: 1, max: 5 },
    updateUserSettings: () => {},
    isPremium: () => false,
    watchAd: () => {},
  }), [
    auth, tasks, habits, categories, okrCategories, events, okrs, lists,
    createTask, updateTaskMutation, deleteTaskMutation,
    createHabit, updateHabitMutation, deleteHabitMutation, toggleHabitCompletionFn,
    createCategory, updateCategoryMutation, deleteCategoryMutation,
    createOKRCategory, updateOKRCategoryMutation, deleteOKRCategoryMutation,
    createEvent, updateEventMutation, deleteEventMutation,
    createOKR, updateOKRMutation, deleteOKRMutation, updateKeyResultMutation,
    createList, updateListMutation, deleteListMutation, addTaskToListMutation, removeTaskFromListMutation,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// Hook compatible avec l'ancien useTasks
export const useTasks_Legacy = (): DataContextType => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useTasks must be used within DataProvider');
  return ctx;
};

// Alias pour compatibilité
export { useTasks_Legacy as useTasks };
