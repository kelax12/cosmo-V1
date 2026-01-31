// =============================================================================
// TASKS API - Couche d'accès aux données
// =============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Task } from '@/shared/types';
import { generateId } from '@/shared/utils';

// DB column mapping (snake_case <-> camelCase)
const mapDbToTask = (db: any): Task => ({
  id: db.id,
  name: db.name,
  priority: db.priority,
  category: db.category_id,
  deadline: db.deadline,
  estimatedTime: db.estimated_time,
  createdAt: db.created_at,
  bookmarked: db.bookmarked,
  completed: db.completed,
  completedAt: db.completed_at,
  isCollaborative: db.is_collaborative,
  collaborators: db.shared_by ? [db.shared_by] : [],
  permissions: db.permissions,
  userId: db.user_id,
});

const mapTaskToDb = (task: Partial<Task>, userId?: string): Record<string, any> => {
  const db: Record<string, any> = {};
  if (task.id !== undefined) db.id = task.id;
  if (task.name !== undefined) db.name = task.name;
  if (task.priority !== undefined) db.priority = task.priority;
  if (task.category !== undefined) db.category_id = task.category;
  if (task.deadline !== undefined) db.deadline = task.deadline;
  if (task.estimatedTime !== undefined) db.estimated_time = task.estimatedTime;
  if (task.createdAt !== undefined) db.created_at = task.createdAt;
  if (task.bookmarked !== undefined) db.bookmarked = task.bookmarked;
  if (task.completed !== undefined) db.completed = task.completed;
  if (task.completedAt !== undefined) db.completed_at = task.completedAt;
  if (task.isCollaborative !== undefined) db.is_collaborative = task.isCollaborative;
  if (task.collaborators !== undefined) db.shared_by = task.collaborators?.[0] || null;
  if (task.permissions !== undefined) db.permissions = task.permissions;
  if (userId) db.user_id = userId;
  return db;
};

// API Functions
export const tasksApi = {
  async fetchAll(userId: string): Promise<Task[]> {
    if (!isSupabaseConfigured) return [];
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapDbToTask);
  },

  async create(task: Omit<Task, 'id' | 'createdAt'>, userId: string): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) return newTask;

    const { data, error } = await supabase
      .from('tasks')
      .insert([mapTaskToDb(newTask, userId)])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapDbToTask(data);
  },

  async update(id: string, updates: Partial<Task>, userId: string): Promise<Task> {
    if (!isSupabaseConfigured) {
      return { id, ...updates } as Task;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(mapTaskToDb(updates))
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapDbToTask(data);
  },

  async delete(id: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  async toggleComplete(id: string, currentState: boolean, userId: string): Promise<Task> {
    const updates = {
      completed: !currentState,
      completedAt: !currentState ? new Date().toISOString() : undefined,
    };
    return this.update(id, updates, userId);
  },

  async toggleBookmark(id: string, currentState: boolean, userId: string): Promise<Task> {
    return this.update(id, { bookmarked: !currentState }, userId);
  },
};
