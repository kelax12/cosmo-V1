# 🔍 RAPPORT D'AUDIT SUPABASE - COSMO TASK MANAGER

## 📊 RÉSUMÉ EXÉCUTIF

| Entité | État Actuel | Intégration Supabase | Problèmes Critiques |
|--------|-------------|----------------------|---------------------|
| **Task** | ⚠️ Partiel | Repository pattern implémenté | Doublon d'API, TaskContext vide |
| **Event** | ❌ Non intégré | Aucun | Données locales uniquement |
| **Liste** | ❌ Non intégré | Aucun | Données locales uniquement |
| **OKR** | ❌ Non intégré | Aucun | Données locales uniquement |
| **Key Result** | ❌ Non intégré | Aucun | Dépend d'OKR |
| **Habitude** | ❌ Non intégré | Aucun | Données locales uniquement |
| **Catégorie** | ❌ Non intégré | Aucun | Données locales uniquement |
| **Catégorie OKR** | ❌ Non intégré | Aucun | Données locales uniquement |

---

## 🚨 PROBLÈME MAJEUR IDENTIFIÉ

### Le `TaskContext` est vide !

Le fichier `/src/context/TaskContext.tsx` actuel ne contient que les données d'authentification. **Toutes les fonctions CRUD utilisées par les composants (`addTask`, `updateTask`, `deleteTask`, `habits`, `events`, `okrs`, etc.) ne sont PAS implémentées.**

**Conséquence :** L'application frontend appelle des fonctions qui n'existent pas → erreurs silencieuses ou crashes.

```typescript
// ÉTAT ACTUEL - TaskContext.tsx
const value = {
  user: auth.user,
  loading: auth.isLoading,
  isAuthenticated: auth.isAuthenticated,
  isDemo: auth.isDemo,
  login: auth.login,
  register: auth.register,
  loginWithGoogle: auth.loginWithGoogle,
  logout: auth.logout,
  // ⚠️ MANQUANT: tasks, events, habits, okrs, categories, lists, etc.
  // ⚠️ MANQUANT: addTask, updateTask, deleteTask, etc.
};
```

---

## 📋 ANALYSE DÉTAILLÉE PAR TYPE DE DONNÉE

---

## 1. TASK (Tâches)

### Structure attendue (Interface TypeScript)
```typescript
interface Task {
  id: string;
  name: string;
  priority: number;              // 1-5
  category: string;              // FK vers categories
  deadline: string;              // ISO date
  estimatedTime: number;         // minutes
  createdAt?: string;
  bookmarked: boolean;
  completed: boolean;
  completedAt?: string;
  isCollaborative?: boolean;
  collaborators?: string[];
  pendingInvites?: string[];
  collaboratorValidations?: Record<string, boolean>;
  userId?: string;               // FK vers auth.users
}
```

### 🔴 PROBLÈMES IDENTIFIÉS

#### 1.1 Doublon d'API
Il existe **deux fichiers** qui gèrent les Tasks :
- `/src/modules/tasks/tasks.api.ts` - API directe sans userId
- `/src/modules/tasks/supabase.repository.ts` - Repository avec userId ✅

**Risque :** Confusion, utilisation de la mauvaise API, données non filtrées par utilisateur.

#### 1.2 tasks.api.ts ne filtre PAS par userId
```typescript
// ⚠️ DANGEREUX - Récupère TOUTES les tâches de tous les utilisateurs !
export const fetchTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')  // PAS DE FILTRE userId !
    .order('createdAt', { ascending: false });
  // ...
};
```

#### 1.3 TaskContext n'utilise PAS les hooks React Query
Les composants utilisent `useTasks()` du TaskContext, mais celui-ci est vide. Les hooks de `/src/modules/tasks/tasks.hooks.ts` ne sont jamais appelés.

### ✅ CORRECTION À APPLIQUER
```typescript
// supabase.repository.ts - DÉJÀ CORRECT ✅
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('userId', user.id)  // ✅ Filtre par userId
  .order('createdAt', { ascending: false });
```

### 📊 SCHÉMA POSTGRES REQUIS POUR TABLE `tasks`
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  priority INTEGER NOT NULL CHECK (priority >= 1 AND priority <= 5),
  category TEXT,
  deadline TIMESTAMPTZ,
  estimated_time INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  bookmarked BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  is_collaborative BOOLEAN DEFAULT false,
  collaborators TEXT[] DEFAULT '{}',
  pending_invites TEXT[] DEFAULT '{}',
  collaborator_validations JSONB DEFAULT '{}',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- RLS Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 2. EVENT (Événements Calendrier)

### Structure attendue
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: string;           // ISO datetime
  end: string;             // ISO datetime
  color: string;
  notes?: string;
  taskId?: string;         // FK optionnelle vers tasks
  userId: string;          // FK vers auth.users
}
```

### 🔴 PROBLÈMES IDENTIFIÉS

#### 2.1 Aucune intégration Supabase
Les events sont stockés **uniquement en mémoire locale**. Aucun fichier repository n'existe.

#### 2.2 Perte de données
À chaque rechargement de page, tous les événements sont perdus.

### 📊 SCHÉMA POSTGRES REQUIS POUR TABLE `events`
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  notes TEXT,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own events"
  ON events FOR ALL
  USING (auth.uid() = user_id);
```

---

## 3. LISTE (TaskList)

### Structure attendue
```typescript
interface TaskList {
  id: string;
  name: string;
  color: string;
  taskIds: string[];       // Array de FK vers tasks
  userId: string;          // FK vers auth.users
}
```

### 🔴 PROBLÈMES IDENTIFIÉS
- Données stockées uniquement en local
- Relation Task ↔ Liste non persistée

### 📊 SCHÉMA POSTGRES REQUIS
```sql
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de jointure (relation N:N)
CREATE TABLE list_tasks (
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (list_id, task_id)
);

-- RLS
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own lists"
  ON lists FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own list_tasks"
  ON list_tasks FOR ALL
  USING (
    list_id IN (SELECT id FROM lists WHERE user_id = auth.uid())
  );
```

---

## 4. OKR (Objectives)

### Structure attendue
```typescript
interface OKR {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  keyResults: KeyResult[];
  completed: boolean;
  estimatedTime: number;
  userId: string;
}
```

### 🔴 PROBLÈMES IDENTIFIÉS
- Données en local uniquement
- Key Results stockés inline (dénormalisé)

### 📊 SCHÉMA POSTGRES REQUIS
```sql
CREATE TABLE okrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  estimated_time INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own okrs"
  ON okrs FOR ALL
  USING (auth.uid() = user_id);
```

---

## 5. KEY RESULT

### Structure attendue
```typescript
interface KeyResult {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  completed: boolean;
  estimatedTime: number;
  history?: {date: string; increment: number;}[];
  okrId: string;           // FK vers okrs
}
```

### 📊 SCHÉMA POSTGRES REQUIS
```sql
CREATE TABLE key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  current_value NUMERIC DEFAULT 0,
  target_value NUMERIC NOT NULL,
  unit TEXT DEFAULT '',
  completed BOOLEAN DEFAULT false,
  estimated_time INTEGER DEFAULT 30,
  history JSONB DEFAULT '[]',
  okr_id UUID NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS via OKR parent
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own key_results"
  ON key_results FOR ALL
  USING (
    okr_id IN (SELECT id FROM okrs WHERE user_id = auth.uid())
  );
```

---

## 6. HABITUDE (Habit)

### Structure attendue
```typescript
interface Habit {
  id: string;
  name: string;
  estimatedTime: number;
  completions: Record<string, boolean>;  // { "2026-01-15": true }
  streak: number;
  color: string;
  createdAt: string;
  userId: string;
}
```

### 🔴 PROBLÈMES IDENTIFIÉS
- `completions` stocké en JSONB (OK mais peut devenir volumineux)
- Streak calculé côté client (devrait être trigger)

### 📊 SCHÉMA POSTGRES REQUIS
```sql
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  estimated_time INTEGER DEFAULT 30,
  completions JSONB DEFAULT '{}',
  streak INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own habits"
  ON habits FOR ALL
  USING (auth.uid() = user_id);
```

---

## 7. CATÉGORIE (Category)

### Structure attendue
```typescript
interface Category {
  id: string;
  name: string;
  color: string;
  userId: string;
}
```

### 📊 SCHÉMA POSTGRES REQUIS
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own categories"
  ON categories FOR ALL
  USING (auth.uid() = user_id);
```

---

## 8. CATÉGORIE OKR (OKRCategory)

### Structure attendue
```typescript
interface OKRCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
}
```

### 📊 SCHÉMA POSTGRES REQUIS
```sql
CREATE TABLE okr_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'Folder',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE okr_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own okr_categories"
  ON okr_categories FOR ALL
  USING (auth.uid() = user_id);
```

---

## 🔗 RELATIONS ENTRE DONNÉES

### Diagramme des Relations
```
┌──────────┐     ┌──────────┐     ┌───────────────┐
│  USER    │────<│  TASK    │────<│  LIST_TASKS   │
└──────────┘     └──────────┘     └───────────────┘
      │                │                  │
      │                ↓                  ↓
      │          ┌──────────┐       ┌──────────┐
      │          │  EVENT   │       │   LIST   │
      │          └──────────┘       └──────────┘
      │
      ├────────<┌──────────┐────<┌──────────────┐
      │         │   OKR    │     │  KEY_RESULT  │
      │         └──────────┘     └──────────────┘
      │
      ├────────<┌──────────┐
      │         │  HABIT   │
      │         └──────────┘
      │
      ├────────<┌──────────────┐
      │         │  CATEGORY    │
      │         └──────────────┘
      │
      └────────<┌──────────────────┐
                │  OKR_CATEGORY    │
                └──────────────────┘
```

### ⚠️ Problèmes de Relations

| Relation | État | Problème |
|----------|------|----------|
| Task → Category | ❌ | Pas de FK, juste un string |
| Task → List | ⚠️ | Array in memory, pas de table de jointure |
| Event → Task | ⚠️ | taskId optionnel mais pas vérifié |
| OKR → KeyResult | ❌ | Stocké inline dans OKR, pas normalisé |
| OKR → OKRCategory | ❌ | Pas de FK, juste un string |

---

## 🛡️ AUTHENTIFICATION ET RLS

### État Actuel
| Table | RLS Activé | Policies | Status |
|-------|------------|----------|--------|
| tasks | ❓ À vérifier | Probablement absentes | ⚠️ |
| events | N/A | Table inexistante | ❌ |
| lists | N/A | Table inexistante | ❌ |
| okrs | N/A | Table inexistante | ❌ |
| key_results | N/A | Table inexistante | ❌ |
| habits | N/A | Table inexistante | ❌ |
| categories | N/A | Table inexistante | ❌ |
| okr_categories | N/A | Table inexistante | ❌ |

### 🔴 RISQUES DE SÉCURITÉ
1. **tasks.api.ts** ne filtre pas par userId → Exposition des données des autres utilisateurs
2. RLS possiblement désactivé → Accès direct à toutes les données
3. Service Role Key exposé côté client → Contournement RLS possible

### ✅ BONNES PRATIQUES RLS À APPLIQUER
```sql
-- Template pour chaque table
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Force RLS même pour le owner
ALTER TABLE [table_name] FORCE ROW LEVEL SECURITY;

-- Policy SELECT
CREATE POLICY "[table]_select" ON [table_name]
  FOR SELECT USING (auth.uid() = user_id);

-- Policy INSERT  
CREATE POLICY "[table]_insert" ON [table_name]
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy UPDATE
CREATE POLICY "[table]_update" ON [table_name]
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy DELETE
CREATE POLICY "[table]_delete" ON [table_name]
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 🐛 BUGS ET PROBLÈMES COURANTS

### 1. Écritures réussies mais non persistées
**Cause :** TaskContext vide, fonctions comme `addTask()` n'existent pas
**Solution :** Implémenter complètement le TaskContext avec Supabase

### 2. Lectures partielles/incohérentes
**Cause :** Aucune table Supabase pour events, habits, okrs, etc.
**Solution :** Créer les tables et repositories

### 3. Doublons potentiels
**Cause :** Pas de contrainte UNIQUE sur les noms + optimistic updates mal gérés
**Solution :** Ajouter des index UNIQUE et vérifier avant insertion

### 4. Race conditions
**Cause :** React Query mal configuré (staleTime: 0, gcTime: 0)
**Solution :** Configurer des valeurs appropriées

### 5. Problèmes de synchronisation
**Cause :** État local (React state) vs État serveur (Supabase) désynchronisés
**Solution :** Utiliser React Query pour tout + invalidation sur mutation

### 6. Appels Supabase redondants
**Cause :** invalidateQueries trop agressif
**Solution :** Optimistic updates + reconciliation

---

## ✅ PLAN DE CORRECTIONS

### Phase 1: Infrastructure (Priorité CRITIQUE)
1. [ ] Créer toutes les tables manquantes dans Supabase
2. [ ] Activer RLS sur toutes les tables
3. [ ] Créer les policies de sécurité
4. [ ] Supprimer le fichier `tasks.api.ts` (doublon dangereux)

### Phase 2: Repositories (Priorité HAUTE)
1. [ ] Créer `events.repository.ts`
2. [ ] Créer `lists.repository.ts`
3. [ ] Créer `okrs.repository.ts`
4. [ ] Créer `key_results.repository.ts`
5. [ ] Créer `habits.repository.ts`
6. [ ] Créer `categories.repository.ts`
7. [ ] Créer `okr_categories.repository.ts`

### Phase 3: Context Complet (Priorité HAUTE)
1. [ ] Réimplémenter `TaskContext.tsx` avec toutes les fonctions
2. [ ] Utiliser les hooks React Query pour chaque entité
3. [ ] Configurer correctement les cache policies

### Phase 4: Tests (Priorité MOYENNE)
1. [ ] Tester chaque CRUD pour chaque entité
2. [ ] Vérifier l'isolation par utilisateur
3. [ ] Tester les edge cases (suppression en cascade, etc.)

---

## 📝 SCRIPT SQL COMPLET POUR SUPABASE

```sql
-- =============================================
-- SCRIPT DE CRÉATION DES TABLES SUPABASE
-- Application: Cosmo Task Manager
-- =============================================

-- 1. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_policy" ON categories FOR ALL USING (auth.uid() = user_id);

-- 2. OKR_CATEGORIES
CREATE TABLE IF NOT EXISTS okr_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'Folder',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE okr_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "okr_categories_policy" ON okr_categories FOR ALL USING (auth.uid() = user_id);

-- 3. TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  category TEXT,
  deadline TIMESTAMPTZ,
  estimated_time INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  bookmarked BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  is_collaborative BOOLEAN DEFAULT false,
  collaborators TEXT[] DEFAULT '{}',
  pending_invites TEXT[] DEFAULT '{}',
  collaborator_validations JSONB DEFAULT '{}',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_policy" ON tasks FOR ALL USING (auth.uid() = user_id);

-- 4. LISTS
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lists_policy" ON lists FOR ALL USING (auth.uid() = user_id);

-- 5. LIST_TASKS (Table de jointure)
CREATE TABLE IF NOT EXISTS list_tasks (
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (list_id, task_id)
);

ALTER TABLE list_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "list_tasks_policy" ON list_tasks FOR ALL
  USING (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));

-- 6. EVENTS
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  notes TEXT,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_policy" ON events FOR ALL USING (auth.uid() = user_id);

-- 7. OKRS
CREATE TABLE IF NOT EXISTS okrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  estimated_time INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "okrs_policy" ON okrs FOR ALL USING (auth.uid() = user_id);

-- 8. KEY_RESULTS
CREATE TABLE IF NOT EXISTS key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  current_value NUMERIC DEFAULT 0,
  target_value NUMERIC NOT NULL,
  unit TEXT DEFAULT '',
  completed BOOLEAN DEFAULT false,
  estimated_time INTEGER DEFAULT 30,
  history JSONB DEFAULT '[]',
  okr_id UUID NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "key_results_policy" ON key_results FOR ALL
  USING (okr_id IN (SELECT id FROM okrs WHERE user_id = auth.uid()));

-- 9. HABITS
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  estimated_time INTEGER DEFAULT 30,
  completions JSONB DEFAULT '{}',
  streak INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "habits_policy" ON habits FOR ALL USING (auth.uid() = user_id);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_okrs_user_id ON okrs(user_id);
CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON key_results(okr_id);
```

---

## 🎯 PROCHAINES ÉTAPES

1. **URGENT:** Exécutez le script SQL ci-dessus dans votre console Supabase
2. **URGENT:** Je vais implémenter le TaskContext complet avec toutes les fonctions
3. **URGENT:** Je vais créer les repositories manquants

Voulez-vous que je procède aux corrections du code ?
