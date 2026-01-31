// =============================================================================
// CONSTANTS - Constantes partagées
// =============================================================================

// Priority colors
export const PRIORITY_COLORS: Record<number, string> = {
  1: '#EF4444', // red
  2: '#F97316', // orange
  3: '#EAB308', // yellow
  4: '#3B82F6', // blue
  5: '#6B7280', // gray
};

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Urgente',
  2: 'Haute',
  3: 'Moyenne',
  4: 'Basse',
  5: 'Très basse',
};

// Default colors palette
export const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // emerald
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
];

// Category icons
export const CATEGORY_ICONS = [
  'Briefcase',
  'Heart',
  'User',
  'Home',
  'Star',
  'Book',
  'Code',
  'Music',
  'Camera',
  'Globe',
];

// Time options for estimated time
export const TIME_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2h' },
  { value: 180, label: '3h' },
  { value: 240, label: '4h' },
];

// Validation patterns
export const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^.{6,}$/,
  name: /^.{2,50}$/,
};

// Local storage keys
export const STORAGE_KEYS = {
  TASKS: 'cosmo_tasks',
  HABITS: 'cosmo_habits',
  EVENTS: 'cosmo_events',
  OKRS: 'cosmo_okrs',
  LISTS: 'cosmo_lists',
  CATEGORIES: 'cosmo_categories',
  OKR_CATEGORIES: 'cosmo_okr_categories',
  SETTINGS: 'cosmo_settings',
  DEMO_SESSION: 'cosmo_demo_session',
} as const;

// Animation variants for Framer Motion
export const FADE_IN = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const SLIDE_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const SLIDE_IN_RIGHT = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const SCALE_IN = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// Stagger children animation
export const STAGGER_CONTAINER = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// Query keys for React Query
export const QUERY_KEYS = {
  TASKS: ['tasks'],
  HABITS: ['habits'],
  EVENTS: ['events'],
  OKRS: ['okrs'],
  LISTS: ['lists'],
  CATEGORIES: ['categories'],
  OKR_CATEGORIES: ['okr-categories'],
} as const;
