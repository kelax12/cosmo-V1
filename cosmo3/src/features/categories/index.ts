// =============================================================================
// CATEGORIES API & HOOKS
// =============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/features/auth';
import { useLocalStorage } from '@/shared/hooks';
import type { Category, OKRCategory } from '@/shared/types';
import { generateId } from '@/shared/utils';

// Initial data
const DEMO_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Personnel', color: '#3B82F6' },
  { id: 'cat-2', name: 'Travail', color: '#EF4444' },
  { id: 'cat-3', name: 'Santé', color: '#10B981' },
  { id: 'cat-4', name: 'Finance', color: '#F59E0B' },
];

const DEMO_OKR_CATEGORIES: OKRCategory[] = [
  { id: 'okr-cat-1', name: 'Carrière', color: '#3B82F6', icon: 'Briefcase' },
  { id: 'okr-cat-2', name: 'Santé', color: '#10B981', icon: 'Heart' },
  { id: 'okr-cat-3', name: 'Personnel', color: '#8B5CF6', icon: 'User' },
];

// =============================================================================
// CATEGORIES
// =============================================================================

const CATEGORIES_KEY = ['categories'];
const CATEGORIES_STORAGE = 'cosmo_categories';

export function useCategories() {
  const { user, isDemo } = useAuth();
  const [localCategories, setLocalCategories] = useLocalStorage<Category[]>(CATEGORIES_STORAGE, DEMO_CATEGORIES);
  
  const query = useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw new Error(error.message);
      return data?.map(c => ({ id: c.id, name: c.name, color: c.color })) || [];
    },
    enabled: !!user && !isDemo,
    staleTime: 1000 * 60 * 10,
  });

  return {
    categories: isDemo ? localCategories : (query.data?.length ? query.data : DEMO_CATEGORIES),
    isLoading: !isDemo && query.isLoading,
    setLocalCategories,
  };
}

export function useCreateCategory() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<Category[]>(CATEGORIES_STORAGE, []);

  return useMutation({
    mutationFn: async (cat: Omit<Category, 'id'>) => {
      const newCat = { ...cat, id: generateId() };
      if (isDemo) return newCat;
      const { error } = await supabase.from('categories').insert([{ ...newCat, user_id: user?.id }]);
      if (error) throw new Error(error.message);
      return newCat;
    },
    onSuccess: (newCat) => {
      if (isDemo) setLocal(prev => [...prev, newCat]);
      else queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
    },
  });
}

export function useUpdateCategory() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<Category[]>(CATEGORIES_STORAGE, []);

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      if (isDemo) return { id, ...updates } as Category;
      const { error } = await supabase.from('categories').update(updates).eq('id', id).eq('user_id', user?.id);
      if (error) throw new Error(error.message);
      return { id, ...updates } as Category;
    },
    onMutate: ({ id, updates }) => {
      if (isDemo) setLocal(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
    },
  });
}

export function useDeleteCategory() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<Category[]>(CATEGORIES_STORAGE, []);

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return;
      const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user?.id);
      if (error) throw new Error(error.message);
    },
    onMutate: (id) => {
      if (isDemo) setLocal(prev => prev.filter(c => c.id !== id));
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
    },
  });
}

// =============================================================================
// OKR CATEGORIES
// =============================================================================

const OKR_CATEGORIES_KEY = ['okr-categories'];
const OKR_CATEGORIES_STORAGE = 'cosmo_okr_categories';

export function useOKRCategories() {
  const { user, isDemo } = useAuth();
  const [localCats, setLocalCats] = useLocalStorage<OKRCategory[]>(OKR_CATEGORIES_STORAGE, DEMO_OKR_CATEGORIES);
  
  const query = useQuery({
    queryKey: OKR_CATEGORIES_KEY,
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase
        .from('okr_categories')
        .select('*')
        .eq('user_id', user?.id);
      if (error) throw new Error(error.message);
      return data?.map(c => ({ id: c.id, name: c.name, color: c.color, icon: c.icon })) || [];
    },
    enabled: !!user && !isDemo,
    staleTime: 1000 * 60 * 10,
  });

  return {
    okrCategories: isDemo ? localCats : (query.data?.length ? query.data : DEMO_OKR_CATEGORIES),
    isLoading: !isDemo && query.isLoading,
    setLocalOKRCategories: setLocalCats,
  };
}

export function useCreateOKRCategory() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<OKRCategory[]>(OKR_CATEGORIES_STORAGE, []);

  return useMutation({
    mutationFn: async (cat: Omit<OKRCategory, 'id'>) => {
      const newCat = { ...cat, id: generateId() };
      if (isDemo) return newCat;
      const { error } = await supabase.from('okr_categories').insert([{ ...newCat, user_id: user?.id }]);
      if (error) throw new Error(error.message);
      return newCat;
    },
    onSuccess: (newCat) => {
      if (isDemo) setLocal(prev => [...prev, newCat]);
      else queryClient.invalidateQueries({ queryKey: OKR_CATEGORIES_KEY });
    },
  });
}

export function useUpdateOKRCategory() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<OKRCategory[]>(OKR_CATEGORIES_STORAGE, []);

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OKRCategory> }) => {
      if (isDemo) return { id, ...updates } as OKRCategory;
      const { error } = await supabase.from('okr_categories').update(updates).eq('id', id).eq('user_id', user?.id);
      if (error) throw new Error(error.message);
      return { id, ...updates } as OKRCategory;
    },
    onMutate: ({ id, updates }) => {
      if (isDemo) setLocal(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: OKR_CATEGORIES_KEY });
    },
  });
}

export function useDeleteOKRCategory() {
  const { user, isDemo } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocal] = useLocalStorage<OKRCategory[]>(OKR_CATEGORIES_STORAGE, []);

  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) return;
      const { error } = await supabase.from('okr_categories').delete().eq('id', id).eq('user_id', user?.id);
      if (error) throw new Error(error.message);
    },
    onMutate: (id) => {
      if (isDemo) setLocal(prev => prev.filter(c => c.id !== id));
    },
    onSettled: () => {
      if (!isDemo) queryClient.invalidateQueries({ queryKey: OKR_CATEGORIES_KEY });
    },
  });
}
