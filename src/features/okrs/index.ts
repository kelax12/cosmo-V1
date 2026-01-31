// =============================================================================
// OKRS API & HOOKS
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { useLocalStorage } from '@/shared/hooks';
import type { OKR, KeyResult } from '@/shared/types';
import { generateId } from '@/shared/utils';

const OKRS_KEY = ['okrs'];
const STORAGE_KEY = 'cosmo_okrs';

const DEMO_OKRS: OKR[] = [
  {
    id: 'okr-1',
    title: 'Améliorer ma productivité',
    description: 'Optimiser mon flux de travail quotidien',
    category: 'okr-cat-1',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    completed: false,
    estimatedTime: 0,
    keyResults: [
      { id: 'kr-1', title: 'Compléter 100 tâches', currentValue: 25, targetValue: 100, unit: 'tâches', completed: false, estimatedTime: 30, history: [] },
      { id: 'kr-2', title: 'Réduire distractions', currentValue: 2, targetValue: 5, unit: 'heures focus/jour', completed: false, estimatedTime: 0, history: [] },
    ],
  },
];

const mapDbToOKR = (db: any): OKR => ({
  id: db.id,
  title: db.title,
  description: db.description,
  category: db.category,
  startDate: db.start_date,
  endDate: db.end_date,
  completed: db.completed,
  estimatedTime: db.estimated_time,
  keyResults: (db.key_results || []).map((kr: any) => ({
    id: kr.id,
    title: kr.title,
    currentValue: kr.current_value,
    targetValue: kr.target_value,
    unit: kr.unit,
    completed: kr.completed,
    estimatedTime: kr.estimated_time,
    history: kr.history || [],
  })),
});

export function useOKRs() {
  const { user, isDemo } = useAuth();
  const [localOKRs, setLocalOKRs] = useLocalStorage<OKR[]>(STORAGE_KEY, DEMO_OKRS);
  
  const query = useQuery({
    queryKey: OKRS_KEY,
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from('okrs')
        .select('*, key_results(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapDbToOKR);
    },
    enabled: !!user && !isDemo,
    staleTime: 1000 * 60 * 5,
  });

  return {
    okrs: isDemo ? localOKRs : (query.data || []),
    isLoading: !isDemo && query.isLoading,
    error: query.error,
    setLocalOKRs,
  };
}

export function useCreateOKR() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<OKR[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async (okr: Omit<OKR, 'id'>) => {
      const newOKR: OKR = { ...okr, id: generateId(), keyResults: okr.keyResults.map(kr => ({ ...kr, id: kr.id || generateId() })) };
      if (isDemo) return newOKR;

      // Insert OKR
      const { error: okrError } = await supabase.from('okrs').insert([{
        id: newOKR.id,
        title: newOKR.title,
        description: newOKR.description,
        category: newOKR.category,
        start_date: newOKR.startDate,
        end_date: newOKR.endDate,
        completed: newOKR.completed,
        estimated_time: newOKR.estimatedTime,
        user_id: user?.id,
      }]);
      if (okrError) throw new Error(okrError.message);

      // Insert Key Results
      if (newOKR.keyResults.length > 0) {
        const { error: krError } = await supabase.from('key_results').insert(
          newOKR.keyResults.map(kr => ({
            id: kr.id,
            title: kr.title,
            current_value: kr.currentValue,
            target_value: kr.targetValue,
            unit: kr.unit,
            completed: kr.completed,
            estimated_time: kr.estimatedTime,
            history: kr.history || [],
            okr_id: newOKR.id,
          }))
        );
        if (krError) throw new Error(krError.message);
      }

      return newOKR;
    },
    onSuccess: (newOKR) => {
      if (isDemo) setLocal(prev => [...prev, newOKR]);
      else queryClient.invalidateQueries({ queryKey: OKRS_KEY });
    },
  });
}

export function useUpdateOKR() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<OKR[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OKR> }) => {
      if (isDemo) return { id, ...updates } as OKR;

      const dbUpdates: Record<string, any> = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.startDate) dbUpdates.start_date = updates.startDate;
      if (updates.endDate) dbUpdates.end_date = updates.endDate;
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
      if (updates.estimatedTime !== undefined) dbUpdates.estimated_time = updates.estimatedTime;

      const { error } = await supabase.from('okrs').update(dbUpdates).eq('id', id).eq('user_id', user?.id);
      if (error) throw new Error(error.message);
      return { id, ...updates } as OKR;
    },
    onMutate: ({ id, updates }) => {
      if (isDemo) setLocal(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: OKRS_KEY });
    },
  });
}

export function useDeleteOKR() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<OKR[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return;
      const { error } = await supabase.from('okrs').delete().eq('id', id).eq('user_id', user?.id);
      if (error) throw new Error(error.message);
    },
    onMutate: (id) => {
      if (isDemo) setLocal(prev => prev.filter(o => o.id !== id));
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: OKRS_KEY });
    },
  });
}

export function useUpdateKeyResult() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [okrs, setLocal] = useLocalStorage<OKR[]>(STORAGE_KEY, []);

  return useMutation({
    mutationFn: async ({ okrId, keyResultId, value }: { okrId: string; keyResultId: string; value: number }) => {
      const okr = okrs.find(o => o.id === okrId);
      const kr = okr?.keyResults.find(k => k.id === keyResultId);
      if (!kr) throw new Error('Key result not found');

      const newHistory = [...(kr.history || []), { date: new Date().toISOString(), increment: value - kr.currentValue }];
      const updates = { current_value: value, completed: value >= kr.targetValue, history: newHistory };

      if (isDemo) return { ...kr, currentValue: value, completed: value >= kr.targetValue, history: newHistory };

      const { error } = await supabase.from('key_results').update(updates).eq('id', keyResultId);
      if (error) throw new Error(error.message);
      return { ...kr, currentValue: value, completed: value >= kr.targetValue, history: newHistory };
    },
    onMutate: ({ okrId, keyResultId, value }) => {
      if (isDemo) {
        setLocal(prev => prev.map(o => {
          if (o.id !== okrId) return o;
          return {
            ...o,
            keyResults: o.keyResults.map(kr => {
              if (kr.id !== keyResultId) return kr;
              const newHistory = [...(kr.history || []), { date: new Date().toISOString(), increment: value - kr.currentValue }];
              return { ...kr, currentValue: value, completed: value >= kr.targetValue, history: newHistory };
            }),
          };
        }));
      }
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: OKRS_KEY });
    },
  });
}
