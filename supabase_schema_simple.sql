-- =============================================
-- SCRIPT SIMPLIFIÉ - TABLES MANQUANTES UNIQUEMENT
-- Application: Cosmo Task Manager
-- 
-- CE SCRIPT NE TOUCHE PAS À VOTRE TABLE TASKS EXISTANTE
-- Il crée uniquement les tables qui n'existent pas
-- =============================================

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

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_all" ON categories;
CREATE POLICY "categories_all" ON categories FOR ALL USING (auth.uid() = user_id);

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

DROP POLICY IF EXISTS "okr_categories_all" ON okr_categories;
CREATE POLICY "okr_categories_all" ON okr_categories FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 3. LISTS
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

DROP POLICY IF EXISTS "lists_all" ON lists;
CREATE POLICY "lists_all" ON lists FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 4. LIST_TASKS (jointure)
-- Note: Nécessite que la table tasks existe avec une colonne id de type UUID
-- =============================================
CREATE TABLE IF NOT EXISTS list_tasks (
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  task_id UUID,
  PRIMARY KEY (list_id, task_id)
);

ALTER TABLE list_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "list_tasks_all" ON list_tasks;
CREATE POLICY "list_tasks_all" ON list_tasks FOR ALL
  USING (list_id IN (SELECT id FROM lists WHERE user_id = auth.uid()));

-- =============================================
-- 5. EVENTS
-- =============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  notes TEXT,
  task_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_all" ON events;
CREATE POLICY "events_all" ON events FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 6. OKRS
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

DROP POLICY IF EXISTS "okrs_all" ON okrs;
CREATE POLICY "okrs_all" ON okrs FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 7. KEY_RESULTS
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

DROP POLICY IF EXISTS "key_results_all" ON key_results;
CREATE POLICY "key_results_all" ON key_results FOR ALL
  USING (okr_id IN (SELECT id FROM okrs WHERE user_id = auth.uid()));

-- =============================================
-- 8. HABITS
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

DROP POLICY IF EXISTS "habits_all" ON habits;
CREATE POLICY "habits_all" ON habits FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- VÉRIFICATION
-- =============================================
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
