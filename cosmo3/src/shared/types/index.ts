// =============================================================================
// SHARED TYPES - Types globaux de l'application
// =============================================================================

// Tasks
export interface Task {
  id: string;
  name: string;
  priority: number;
  category: string;
  deadline: string;
  estimatedTime: number;
  createdAt?: string;
  bookmarked: boolean;
  completed: boolean;
  completedAt?: string;
  isCollaborative?: boolean;
  collaborators?: string[];
  pendingInvites?: string[];
  collaboratorValidations?: Record<string, boolean>;
  permissions?: 'owner' | 'editor' | 'viewer' | 'responsible';
  userId?: string;
}

// Categories
export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface OKRCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// OKRs
export interface KeyResult {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  completed: boolean;
  estimatedTime: number;
  history?: { date: string; increment: number }[];
}

export interface OKR {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  keyResults: KeyResult[];
  completed: boolean;
  estimatedTime: number;
}

// Habits
export interface Habit {
  id: string;
  name: string;
  estimatedTime: number;
  completions: Record<string, boolean>;
  streak: number;
  color: string;
  createdAt?: string;
}

// Events
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  notes?: string;
  taskId?: string;
}

// Lists
export interface TaskList {
  id: string;
  name: string;
  color: string;
  taskIds: string[];
}

// Users & Friends
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  premiumTokens: number;
  premiumWinStreak: number;
  lastTokenConsumption: string;
  subscriptionEndDate?: string;
  autoValidation: boolean;
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Settings
export interface ColorSettings {
  [key: string]: string;
}

export interface UserSettings {
  name?: string;
  email?: string;
  avatar?: string;
  premiumExpiry?: string;
  adWatchCount?: number;
  lastAdWatch?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
