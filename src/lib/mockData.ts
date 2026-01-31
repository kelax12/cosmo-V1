import { Category, Task, Habit, OKR, OKRCategory } from '@/context/TaskContext';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Personnel', color: '#3B82F6' },
  { id: 'cat-2', name: 'Travail', color: '#EF4444' },
  { id: 'cat-3', name: 'Santé', color: '#10B981' },
  { id: 'cat-4', name: 'Loisirs', color: '#F59E0B' },
  { id: 'cat-5', name: 'Finance', color: '#8B5CF6' },
];

export const INITIAL_OKR_CATEGORIES: OKRCategory[] = [
  { id: 'okrcat-1', name: 'Carrière', color: '#3B82F6', icon: 'Briefcase' },
  { id: 'okrcat-2', name: 'Santé', color: '#10B981', icon: 'Heart' },
  { id: 'okrcat-3', name: 'Apprentissage', color: '#8B5CF6', icon: 'Book' },
  { id: 'okrcat-4', name: 'Finance', color: '#F59E0B', icon: 'TrendingUp' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    name: 'Finaliser le rapport mensuel Cosmo',
    priority: 5,
    category: 'cat-2',
    deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    estimatedTime: 120,
    createdAt: new Date().toISOString(),
    bookmarked: true,
    completed: false
  },
  {
    id: 'task-2',
    name: 'Séance de HIIT intense',
    priority: 4,
    category: 'cat-3',
    deadline: new Date().toISOString().split('T')[0],
    estimatedTime: 45,
    createdAt: new Date().toISOString(),
    bookmarked: false,
    completed: true,
    completedAt: new Date().toISOString()
  },
  {
    id: 'task-3',
    name: 'Préparer la présentation roadmap Q1',
    priority: 5,
    category: 'cat-2',
    deadline: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    estimatedTime: 180,
    createdAt: new Date().toISOString(),
    bookmarked: true,
    completed: false
  },
  {
    id: 'task-4',
    name: 'Appeler la banque (prêt immo)',
    priority: 3,
    category: 'cat-5',
    deadline: new Date().toISOString().split('T')[0],
    estimatedTime: 20,
    createdAt: new Date().toISOString(),
    bookmarked: false,
    completed: false
  },
  {
    id: 'task-5',
    name: 'Lecture : "Atomic Habits"',
    priority: 2,
    category: 'cat-1',
    deadline: new Date().toISOString().split('T')[0],
    estimatedTime: 30,
    createdAt: new Date().toISOString(),
    bookmarked: false,
    completed: false
  }
];

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    name: 'Méditation Matinale',
    estimatedTime: 15,
    completions: { [new Date().toISOString().split('T')[0]]: true },
    streak: 12,
    color: '#3B82F6',
    createdAt: new Date().toISOString()
  },
  {
    id: 'habit-2',
    name: 'Lecture du soir',
    estimatedTime: 30,
    completions: { [new Date().toISOString().split('T')[0]]: false },
    streak: 8,
    color: '#8B5CF6',
    createdAt: new Date().toISOString()
  },
  {
    id: 'habit-3',
    name: 'Hydratation (2L/jour)',
    estimatedTime: 5,
    completions: { [new Date().toISOString().split('T')[0]]: true },
    streak: 25,
    color: '#10B981',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_OKRS: OKR[] = [
  {
    id: 'okr-1',
    title: 'Devenir Senior Developer Cosmo',
    description: 'Atteindre un niveau d\'expertise exceptionnel sur la stack technique.',
    category: 'okrcat-3',
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    completed: false,
    keyResults: [
      { id: 'kr-1', title: 'Maîtriser TypeScript & Design Patterns', currentValue: 80, targetValue: 100, unit: '%', completed: false, estimatedTime: 40 },
      { id: 'kr-2', title: 'Lancer 2 features majeures', currentValue: 1, targetValue: 2, unit: 'features', completed: false, estimatedTime: 80 }
    ],
    estimatedTime: 120
  },
  {
    id: 'okr-2',
    title: 'Liberté Financière',
    description: 'Optimiser les investissements et épargner pour le futur.',
    category: 'okrcat-4',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    completed: false,
    keyResults: [
      { id: 'kr-3', title: 'Épargner 10k€', currentValue: 2500, targetValue: 10000, unit: '€', completed: false, estimatedTime: 0 }
    ],
    estimatedTime: 0
  }
];
