// =============================================================================
// LISTS API & HOOKS
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { useLocalStorage } from '@/shared/hooks';
import type { TaskList } from '@/shared/types';
import { generateId } from '@/shared/utils';

const LISTS_KEY = ['lists'];
const STORAGE_KEY = 'cosmo_lists';

export function useLists() {
  const { user, isDemo } = useAuth();
  const [localLists, setLocalLists] = useLocalStorage<TaskList[]>(STORAGE_KEY, []);
  
  const query = useQuery({
    queryKey: LISTS_KEY,
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from('lists')
        .select('*, list_tasks(task_id)')
        .eq('user_id', user?.id);
      if (error) throw new Error(error.message);
      return (data || []).map(l => ({
        id: l.id,
        name: l.name,
        color: l.color,
        taskIds: (l.list_tasks || []).map((lt: any) => lt.task_id),
      }));
    },
    enabled: !!user && !isDemo,
    staleTime: 1000 * 60 * 5,
  });

  return {
    lists: isDemo ? localLists : (query.data || []),
    isLoading: !isDemo && query.isLoading,
    error: query.error,
    setLocalLists,
  };
}

export function useCreateList() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<TaskList[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async (list: Omit<TaskList, 'id' | 'taskIds'>) => {
      const newList: TaskList = { ...list, id: generateId(), taskIds: [] };
      if (isDemo) return newList;
      const { error } = await supabase.from('lists').insert([{ id: newList.id, name: newList.name, color: newList.color, user_id: user?.id }]);
      if (error) throw new Error(error.message);
      return newList;
    },
    onSuccess: (newList) => {
      if (isDemo) setLocal(prev => [...prev, newList]);
      else queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}

export function useUpdateList() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<TaskList[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskList> }) => {
      if (isDemo) return { id, ...updates } as TaskList;
      const { name, color } = updates;
      const { error } = await supabase.from('lists').update({ name, color }).eq('id', id).eq('user_id', user?.id);
      if (error) throw new Error(error.message);
      return { id, ...updates } as TaskList;
    },
    onMutate: ({ id, updates }) => {
      if (isDemo) setLocal(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}

export function useDeleteList() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<TaskList[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return;
      const { error } = await supabase.from('lists').delete().eq('id', id).eq('user_id', user?.id);
      if (error) throw new Error(error.message);
    },
    onMutate: (id) => {
      if (isDemo) setLocal(prev => prev.filter(l => l.id !== id));
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}

export function useAddTaskToList() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<TaskList[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async ({ listId, taskId }: { listId: string; taskId: string }) => {
      if (isDemo) return;
      const { error } = await supabase.from('list_tasks').insert([{ list_id: listId, task_id: taskId }]);
      if (error) throw new Error(error.message);
    },
    onMutate: ({ listId, taskId }) => {
      if (isDemo) {
        setLocal(prev => prev.map(l => {
          if (l.id === listId && !l.taskIds.includes(taskId)) {
            return { ...l, taskIds: [...l.taskIds, taskId] };
          }
          return l;
        }));
      }
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}

export function useRemoveTaskFromList() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<TaskList[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async ({ listId, taskId }: { listId: string; taskId: string }) => {
      if (isDemo) return;
      const { error } = await supabase.from('list_tasks').delete().eq('list_id', listId).eq('task_id', taskId);
      if (error) throw new Error(error.message);
    },
    onMutate: ({ listId, taskId }) => {
      if (isDemo) {
        setLocal(prev => prev.map(l => {
          if (l.id === listId) {
            return { ...l, taskIds: l.taskIds.filter(id => id !== taskId) };
          }
          return l;
        }));
      }
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}
