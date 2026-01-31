// =============================================================================
// HABITS API
// =============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Habit } from '@/shared/types';
import { generateId } from '@/shared/utils';

const mapDbToHabit = (db: any): Habit => ({
  id: db.id,
  name: db.name,
  estimatedTime: db.estimated_time,
  completions: db.completions || {},
  streak: db.streak,
  color: db.color,
  createdAt: db.created_at,
});

const mapHabitToDb = (habit: Partial<Habit>, userId?: string): Record<string, any> => {
  const db: Record<string, any> = {};
  if (habit.id !== undefined) db.id = habit.id;
  if (habit.name !== undefined) db.name = habit.name;
  if (habit.estimatedTime !== undefined) db.estimated_time = habit.estimatedTime;
  if (habit.completions !== undefined) db.completions = habit.completions;
  if (habit.streak !== undefined) db.streak = habit.streak;
  if (habit.color !== undefined) db.color = habit.color;
  if (userId) db.user_id = userId;
  return db;
};

export const habitsApi = {
  async fetchAll(userId: string): Promise<Habit[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToHabit);
  },

  async create(habit: Omit<Habit, 'id' | 'createdAt'>, userId: string): Promise<Habit> {
    const newHabit = { ...habit, id: generateId(), createdAt: new Date().toISOString() };
    if (!isSupabaseConfigured) return newHabit as Habit;
    const { data, error } = await supabase
      .from('habits')
      .insert([mapHabitToDb(newHabit, userId)])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapDbToHabit(data);
  },

  async update(id: string, updates: Partial<Habit>, userId: string): Promise<Habit> {
    if (!isSupabaseConfigured) return { id, ...updates } as Habit;
    const { data, error } = await supabase
      .from('habits')
      .update(mapHabitToDb(updates))
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapDbToHabit(data);
  },

  async delete(id: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', userId);
    if (error) throw new Error(error.message);
  },
};
