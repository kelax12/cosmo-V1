-- =============================================
-- SCRIPT DE CRÉATION DES TABLES SUPABASE
-- Application: Cosmo Task Manager
-- 
-- INSTRUCTIONS:
-- 1. Connectez-vous à votre dashboard Supabase
-- 2. Allez dans SQL Editor
-- 3. Copiez-collez ce script
-- 4. Exécutez-le
-- =============================================

-- Suppression des tables existantes (optionnel - décommenter si besoin)
-- DROP TABLE IF EXISTS list_tasks CASCADE;
-- DROP TABLE IF EXISTS key_results CASCADE;
-- DROP TABLE IF EXISTS events CASCADE;
-- DROP TABLE IF EXISTS lists CASCADE;
-- DROP TABLE IF EXISTS habits CASCADE;
-- DROP TABLE IF EXISTS okrs CASCADE;
-- DROP TABLE IF EXISTS okr_categories CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;

-- =============================================
-- 1. CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Activer RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert" ON categories;
DROP POLICY IF EXISTS "categories_update" ON categories;
DROP POLICY IF EXISTS "categories_delete" ON categories;

-- Créer les policies
CREATE POLICY "categories_select" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 2. OKR_CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS okr_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'Folder',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_okr_categories_user_id ON okr_categories(user_id);

ALTER TABLE okr_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "okr_categories_select" ON okr_categories;
DROP POLICY IF EXISTS "okr_categories_insert" ON okr_categories;
DROP POLICY IF EXISTS "okr_categories_update" ON okr_categories;
DROP POLICY IF EXISTS "okr_categories_delete" ON okr_categories;

CREATE POLICY "okr_categories_select" ON okr_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "okr_categories_insert" ON okr_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "okr_categories_update" ON okr_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "okr_categories_delete" ON okr_categories FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 3. TASKS 
-- IMPORTANT: Si votre table tasks existe déjà, commentez cette section
-- et passez directement à la section 4. LISTS
-- =============================================

-- Vérifiez d'abord si la table existe. Si oui, sautez la création.
-- Si vous avez déjà une table tasks, exécutez uniquement les policies ci-dessous.

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
    CREATE TABLE tasks (
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
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 4. LISTS
-- =============================================
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);

ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lists_select" ON lists;
DROP POLICY IF EXISTS "lists_insert" ON lists;
DROP POLICY IF EXISTS "lists_update" ON lists;
DROP POLICY IF EXISTS "lists_delete" ON lists;

CREATE POLICY "lists_select" ON lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lists_insert" ON lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lists_update" ON lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "lists_delete" ON lists FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 5. LIST_TASKS (Table de jointure)
-- =============================================
CREATE TABLE IF NOT EXISTS list_tasks (
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (list_id, task_id)
);

ALTER TABLE list_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "list_tasks_select" ON list_tasks;
DROP POLICY IF EXISTS "list_tasks_insert" ON list_tasks;
DROP POLICY IF EXISTS "list_tasks_delete" ON list_tasks;

CREATE POLICY "list_tasks_select" ON list_tasks FOR SELECT
  USING (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));
CREATE POLICY "list_tasks_insert" ON list_tasks FOR INSERT
  WITH CHECK (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));
CREATE POLICY "list_tasks_delete" ON list_tasks FOR DELETE
  USING (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));

-- =============================================
-- 6. EVENTS
-- =============================================
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

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select" ON events;
DROP POLICY IF EXISTS "events_insert" ON events;
DROP POLICY IF EXISTS "events_update" ON events;
DROP POLICY IF EXISTS "events_delete" ON events;

CREATE POLICY "events_select" ON events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "events_update" ON events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "events_delete" ON events FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 7. OKRS
-- =============================================
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

CREATE INDEX IF NOT EXISTS idx_okrs_user_id ON okrs(user_id);

ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "okrs_select" ON okrs;
DROP POLICY IF EXISTS "okrs_insert" ON okrs;
DROP POLICY IF EXISTS "okrs_update" ON okrs;
DROP POLICY IF EXISTS "okrs_delete" ON okrs;

CREATE POLICY "okrs_select" ON okrs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "okrs_insert" ON okrs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "okrs_update" ON okrs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "okrs_delete" ON okrs FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 8. KEY_RESULTS
-- =============================================
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

CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON key_results(okr_id);

ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "key_results_select" ON key_results;
DROP POLICY IF EXISTS "key_results_insert" ON key_results;
DROP POLICY IF EXISTS "key_results_update" ON key_results;
DROP POLICY IF EXISTS "key_results_delete" ON key_results;

-- Les key results sont accessibles via leur OKR parent
CREATE POLICY "key_results_select" ON key_results FOR SELECT
  USING (okr_id IN (SELECT id FROM okrs WHERE user_id = auth.uid()));
CREATE POLICY "key_results_insert" ON key_results FOR INSERT
  WITH CHECK (okr_id IN (SELECT id FROM okrs WHERE user_id = auth.uid()));
CREATE POLICY "key_results_update" ON key_results FOR UPDATE
  USING (okr_id IN (SELECT id FROM okrs WHERE user_id = auth.uid()));
CREATE POLICY "key_results_delete" ON key_results FOR DELETE
  USING (okr_id IN (SELECT id FROM okrs WHERE user_id = auth.uid()));

-- =============================================
-- 9. HABITS
-- =============================================
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

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "habits_select" ON habits;
DROP POLICY IF EXISTS "habits_insert" ON habits;
DROP POLICY IF EXISTS "habits_update" ON habits;
DROP POLICY IF EXISTS "habits_delete" ON habits;

CREATE POLICY "habits_select" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "habits_insert" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habits_update" ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "habits_delete" ON habits FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FIN DU SCRIPT
-- =============================================

-- Vérification des tables créées
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
