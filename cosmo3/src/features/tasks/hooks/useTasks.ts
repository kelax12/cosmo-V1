// =============================================================================
// TASKS HOOKS - React Query hooks pour les tâches
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api';
import { useAuth } from '@/features/auth';
import { useLocalStorage } from '@/shared/hooks';
import type { Task } from '@/shared/types';
import { generateId } from '@/shared/utils';

const TASKS_KEY = ['tasks'];
const STORAGE_KEY = 'cosmo_tasks';

// Initial demo data
const DEMO_TASKS: Task[] = [
  {
    id: 'task-1',
    name: 'Finaliser le rapport mensuel',
    priority: 1,
    category: 'cat-2',
    deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    estimatedTime: 120,
    createdAt: new Date().toISOString(),
    bookmarked: true,
    completed: false,
  },
  {
    id: 'task-2',
    name: 'Séance de sport',
    priority: 2,
    category: 'cat-3',
    deadline: new Date().toISOString().split('T')[0],
    estimatedTime: 45,
    createdAt: new Date().toISOString(),
    bookmarked: false,
    completed: true,
    completedAt: new Date().toISOString(),
  },
];

// Main hook for tasks
export function useTasks() {
  const { user, isDemo } = useAuth();
  const [localTasks, setLocalTasks] = useLocalStorage<Task[]>(STORAGE_KEY, DEMO_TASKS);
  const queryClient = useQueryClient();

  // Query for fetching tasks
  const query = useQuery({
    queryKey: TASKS_KEY,
    queryFn: () => tasksApi.fetchAll(user?.id || ''),
    enabled: !!user && !isDemo,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Return local tasks for demo mode
  const tasks = isDemo ? localTasks : (query.data || []);

  return {
    tasks,
    isLoading: !isDemo && query.isLoading,
    error: query.error,
    // For demo mode updates
    setLocalTasks,
  };
}

// Create task mutation
export function useCreateTask() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [localTasks, setLocalTasks] = useLocalStorage<Task[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'createdAt'>) => {
      if (isDemo) {
        const newTask: Task = {
          ...task,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        return newTask;
      }
      return tasksApi.create(task, user?.id || '');
    },
    onSuccess: (newTask) => {
      if (isDemo) {
        setLocalTasks(prev => [newTask, ...prev]);
      } else {
        queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      }
    },
  });
}

// Update task mutation
export function useUpdateTask() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocalTasks] = useLocalStorage<Task[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      if (isDemo) {
        return { id, ...updates } as Task;
      }
      return tasksApi.update(id, updates, user?.id || '');
    },
    onMutate: async ({ id, updates }) => {
      // Optimistic update
      if (isDemo) {
        setLocalTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      } else {
        await queryClient.cancelQueries({ queryKey: TASKS_KEY });
        const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
        queryClient.setQueryData<Task[]>(TASKS_KEY, old => 
          old?.map(t => t.id === id ? { ...t, ...updates } : t) || []
        );
        return { previous };
      }
    },
    onError: (err, variables, context) => {
      if (!isDemo && context?.previous) {
        queryClient.setQueryData(TASKS_KEY, context.previous);
      }
    },
    onSettled: () => {
      if (!isDemo) {
        queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      }
    },
  });
}

// Delete task mutation
export function useDeleteTask() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocalTasks] = useLocalStorage<Task[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return;
      return tasksApi.delete(id, user?.id || '');
    },
    onMutate: async (id) => {
      if (isDemo) {
        setLocalTasks(prev => prev.filter(t => t.id !== id));
      } else {
        await queryClient.cancelQueries({ queryKey: TASKS_KEY });
        const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
        queryClient.setQueryData<Task[]>(TASKS_KEY, old => old?.filter(t => t.id !== id) || []);
        return { previous };
      }
    },
    onError: (err, id, context) => {
      if (!isDemo && context?.previous) {
        queryClient.setQueryData(TASKS_KEY, context.previous);
      }
    },
    onSettled: () => {
      if (!isDemo) {
        queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      }
    },
  });
}

// Toggle complete mutation
export function useToggleTaskComplete() {
  const updateTask = useUpdateTask();

  return (task: Task) => {
    updateTask.mutate({
      id: task.id,
      updates: {
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : undefined,
      },
    });
  };
}

// Toggle bookmark mutation
export function useToggleTaskBookmark() {
  const updateTask = useUpdateTask();

  return (task: Task) => {
    updateTask.mutate({
      id: task.id,
      updates: { bookmarked: !task.bookmarked },
    });
  };
}
