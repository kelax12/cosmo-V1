# 🚀 COSMO Task Manager

Application de gestion de tâches augmentée par IA avec OKRs, habitudes et calendrier.

## ⚡ Démarrage Rapide

```bash
git clone https://github.com/kelax12/cosmo3.git
cd cosmo3
yarn install
yarn dev
```

L'application démarre sur `http://localhost:5173`

Cliquez sur **"Essayer en mode Demo"** sur la page de login - aucune configuration requise !

## 🏗️ Architecture

```
src/
├── app/                    # Configuration app
│   └── App.tsx            # Routes et providers principaux
│
├── features/              # Modules par domaine métier (Feature-Sliced Design)
│   ├── auth/              # Authentification
│   │   └── AuthContext.tsx
│   ├── tasks/             # Gestion des tâches
│   │   ├── api/           # Appels Supabase
│   │   └── hooks/         # React Query hooks
│   ├── habits/            # Habitudes
│   ├── okrs/              # Objectifs et Key Results
│   ├── events/            # Événements calendrier
│   ├── categories/        # Catégories
│   ├── lists/             # Listes de tâches
│   └── data/              # DataProvider (compatibilité legacy)
│
├── shared/                # Code partagé
│   ├── types/             # Types TypeScript globaux
│   ├── hooks/             # Hooks réutilisables
│   └── utils/             # Fonctions utilitaires
│
├── components/            # Composants UI
│   └── ui/                # Composants Shadcn/Radix
│
├── pages/                 # Pages de l'application
│
├── context/               # Context legacy (compatibilité)
│
└── lib/                   # Config externe (Supabase)
```

## 🎯 Principes d'Architecture

### Feature-Sliced Design
Chaque feature est isolée avec sa propre :
- **API** : Fonctions d'accès aux données Supabase
- **Hooks** : React Query hooks avec cache intelligent
- **Components** : Composants spécifiques au domaine

### React Query
- Cache automatique (5 min staleTime)
- Optimistic updates pour une UX fluide
- Invalidation intelligente après mutations

### Mode Demo
- Fonctionne sans backend Supabase
- Données persistées en localStorage
- Parfait pour tester/démontrer

## 📋 Utilisation des Hooks

```tsx
// Nouveau style (recommandé)
import { useTasks, useCreateTask } from '@/features/tasks';

function MyComponent() {
  const { tasks, isLoading } = useTasks();
  const createTask = useCreateTask();
  
  const handleAdd = () => {
    createTask.mutate({ name: 'Nouvelle tâche', priority: 1 });
  };
}

// Style legacy (compatibilité)
import { useTasks } from '@/context/TaskContext';

function LegacyComponent() {
  const { tasks, addTask } = useTasks();
}
```

## 🔧 Configuration Supabase

1. Créez `.env` depuis `.env.example`
2. Ajoutez vos clés Supabase
3. Exécutez `supabase_schema_simple.sql` dans SQL Editor

## 📦 Scripts

| Commande | Description |
|----------|-------------|
| `yarn dev` | Serveur de développement |
| `yarn build` | Build production |
| `yarn preview` | Preview du build |

## 🛠️ Stack Technique

- **Frontend**: React 18 + TypeScript + Vite
- **State**: TanStack Query (React Query)
- **Styling**: Tailwind CSS + Shadcn/UI
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Animations**: Framer Motion

## 📄 Licence

MIT
