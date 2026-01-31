// =============================================================================
// EVENTS API & HOOKS
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { useLocalStorage } from '@/shared/hooks';
import type { CalendarEvent } from '@/shared/types';
import { generateId } from '@/shared/utils';

const EVENTS_KEY = ['events'];
const STORAGE_KEY = 'cosmo_events';

const mapDbToEvent = (db: any): CalendarEvent => ({
  id: db.id,
  title: db.title,
  start: db.start_time,
  end: db.end_time,
  color: db.color,
  notes: db.notes,
  taskId: db.task_id,
});

const mapEventToDb = (event: Partial<CalendarEvent>, userId?: string): Record<string, any> => {
  const db: Record<string, any> = {};
  if (event.id !== undefined) db.id = event.id;
  if (event.title !== undefined) db.title = event.title;
  if (event.start !== undefined) db.start_time = event.start;
  if (event.end !== undefined) db.end_time = event.end;
  if (event.color !== undefined) db.color = event.color;
  if (event.notes !== undefined) db.notes = event.notes;
  if (event.taskId !== undefined) db.task_id = event.taskId;
  if (userId) db.user_id = userId;
  return db;
};

export function useEvents() {
  const { user, isDemo } = useAuth();
  const [localEvents, setLocalEvents] = useLocalStorage<CalendarEvent[]>(STORAGE_KEY, []);
  
  const query = useQuery({
    queryKey: EVENTS_KEY,
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user?.id)
        .order('start_time', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []).map(mapDbToEvent);
    },
    enabled: !!user && !isDemo,
    staleTime: 1000 * 60 * 5,
  });

  return {
    events: isDemo ? localEvents : (query.data || []),
    isLoading: !isDemo && query.isLoading,
    error: query.error,
    setLocalEvents,
  };
}

export function useCreateEvent() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<CalendarEvent[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async (event: Omit<CalendarEvent, 'id'>) => {
      const newEvent = { ...event, id: generateId() };
      if (isDemo) return newEvent;
      const { data, error } = await supabase
        .from('events')
        .insert([mapEventToDb(newEvent, user?.id)])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapDbToEvent(data);
    },
    onSuccess: (newEvent) => {
      if (isDemo) setLocal(prev => [...prev, newEvent]);
      else queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    },
  });
}

export function useUpdateEvent() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<CalendarEvent[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CalendarEvent> }) => {
      if (isDemo) return { id, ...updates } as CalendarEvent;
      const { data, error } = await supabase
        .from('events')
        .update(mapEventToDb(updates))
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapDbToEvent(data);
    },
    onMutate: ({ id, updates }) => {
      if (isDemo) setLocal(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    },
  });
}

export function useDeleteEvent() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<CalendarEvent[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return;
      const { error } = await supabase.from('events').delete().eq('id', id).eq('user_id', user?.id);
      if (error) throw new Error(error.message);
    },
    onMutate: (id) => {
      if (isDemo) setLocal(prev => prev.filter(e => e.id !== id));
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    },
  });
}
