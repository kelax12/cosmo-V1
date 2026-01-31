// =============================================================================
// HABITS HOOKS
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsApi } from '../api/habits.api';
import { useAuth } from '@/features/auth';
import { useLocalStorage } from '@/shared/hooks';
import type { Habit } from '@/shared/types';
import { generateId, getTodayString } from '@/shared/utils';

const HABITS_KEY = ['habits'];
const STORAGE_KEY = 'cosmo_habits';

const DEMO_HABITS: Habit[] = [
  { id: 'habit-1', name: 'Méditation', estimatedTime: 15, completions: {}, streak: 0, color: '#8B5CF6' },
  { id: 'habit-2', name: 'Lecture', estimatedTime: 30, completions: {}, streak: 0, color: '#3B82F6' },
];

export function useHabits() {
  const { user, isDemo } = useAuth();
  const [localHabits, setLocalHabits] = useLocalStorage<Habit[]>(STORAGE_KEY, DEMO_HABITS);
  
  const query = useQuery({
    queryKey: HABITS_KEY,
    queryFn: () => habitsApi.fetchAll(user?.id || ''),
    enabled: !!user && !isDemo,
    staleTime: 1000 * 60 * 5,
  });

  return {
    habits: isDemo ? localHabits : (query.data || []),
    isLoading: !isDemo && query.isLoading,
    error: query.error,
    setLocalHabits,
  };
}

export function useCreateHabit() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocalHabits] = useLocalStorage<Habit[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async (habit: Omit<Habit, 'id' | 'createdAt'>) => {
      if (isDemo) return { ...habit, id: generateId(), createdAt: new Date().toISOString() } as Habit;
      return habitsApi.create(habit, user?.id || '');
    },
    onSuccess: (newHabit) => {
      if (isDemo) setLocalHabits(prev => [...prev, newHabit]);
      else queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    },
  });
}

export function useUpdateHabit() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocalHabits] = useLocalStorage<Habit[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Habit> }) => {
      if (isDemo) return { id, ...updates } as Habit;
      return habitsApi.update(id, updates, user?.id || '');
    },
    onMutate: async ({ id, updates }) => {
      if (isDemo) setLocalHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    },
  });
}

export function useDeleteHabit() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocalHabits] = useLocalStorage<Habit[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return;
      return habitsApi.delete(id, user?.id || '');
    },
    onMutate: async (id) => {
      if (isDemo) setLocalHabits(prev => prev.filter(h => h.id !== id));
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    },
  });
}

export function useToggleHabitCompletion() {
  const updateHabit = useUpdateHabit();
  const { habits } = useHabits();

  return (habitId: string, date?: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const targetDate = date || getTodayString();
    const newCompletions = { ...habit.completions };
    newCompletions[targetDate] = !newCompletions[targetDate];

    // Calculate streak
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (newCompletions[dateStr]) streak++;
      else if (i > 0) break;
    }

    updateHabit.mutate({ id: habitId, updates: { completions: newCompletions, streak } });
  };
}
