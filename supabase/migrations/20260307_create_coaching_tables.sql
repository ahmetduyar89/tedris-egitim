-- ============================================================
-- Öğrenci Koçluğu Modülü - Veritabanı Tabloları
-- ============================================================

-- 1. Öğrenci Koçluk Profili (Envanter)
CREATE TABLE IF NOT EXISTS coaching_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  learning_style VARCHAR(20), -- visual, auditory, kinesthetic, reading_writing
  personality_type VARCHAR(50),
  study_habits JSONB DEFAULT '{}', -- {preferred_time, avg_hours, environment, breaks}
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  motivation_level INT CHECK (motivation_level BETWEEN 1 AND 10),
  multiple_intelligence JSONB DEFAULT '{}', -- {linguistic, logical, spatial, musical, bodily, interpersonal, intrapersonal, naturalistic}
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id)
);

-- 2. Koçluk Hedefleri
CREATE TABLE IF NOT EXISTS coaching_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  goal_type VARCHAR(20) NOT NULL CHECK (goal_type IN ('short_term', 'mid_term', 'long_term')),
  category VARCHAR(30) CHECK (category IN ('academic', 'behavioral', 'motivational', 'organizational')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit VARCHAR(50),
  deadline DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  priority INT DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Hedef Milestone'ları
CREATE TABLE IF NOT EXISTS coaching_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES coaching_goals(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  target_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Koçluk Seansları
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date TIMESTAMPTZ NOT NULL,
  duration_minutes INT,
  session_type VARCHAR(20) DEFAULT 'regular' CHECK (session_type IN ('regular', 'emergency', 'review', 'goal_setting')),
  topics_discussed TEXT[] DEFAULT '{}',
  action_items JSONB DEFAULT '[]', -- [{task, deadline, status}]
  student_mood INT CHECK (student_mood BETWEEN 1 AND 5),
  coach_notes TEXT,
  student_feedback TEXT,
  next_session_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Günlük Çalışma Logu
CREATE TABLE IF NOT EXISTS daily_study_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entries JSONB NOT NULL DEFAULT '[]', -- [{subject, topic, duration_minutes, type, notes}]
  total_minutes INT DEFAULT 0,
  mood INT CHECK (mood BETWEEN 1 AND 5),
  energy_level INT CHECK (energy_level BETWEEN 1 AND 5),
  reflection TEXT,
  tutor_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, log_date)
);

-- 6. Alışkanlık Tanımları
CREATE TABLE IF NOT EXISTS coaching_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_name VARCHAR(200) NOT NULL,
  description TEXT,
  frequency VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekdays', 'weekly')),
  target_count INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Alışkanlık Logları
CREATE TABLE IF NOT EXISTS coaching_habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES coaching_habits(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT FALSE,
  count INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, log_date)
);

-- ============================================================
-- İndeksler
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_coaching_profiles_student ON coaching_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_coaching_profiles_tutor ON coaching_profiles(tutor_id);
CREATE INDEX IF NOT EXISTS idx_coaching_goals_student ON coaching_goals(student_id);
CREATE INDEX IF NOT EXISTS idx_coaching_goals_tutor ON coaching_goals(tutor_id);
CREATE INDEX IF NOT EXISTS idx_coaching_goals_status ON coaching_goals(status);
CREATE INDEX IF NOT EXISTS idx_coaching_milestones_goal ON coaching_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_student ON coaching_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_tutor ON coaching_sessions(tutor_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_date ON coaching_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_daily_study_logs_student ON daily_study_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_study_logs_date ON daily_study_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_coaching_habits_student ON coaching_habits(student_id);
CREATE INDEX IF NOT EXISTS idx_coaching_habit_logs_habit ON coaching_habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_coaching_habit_logs_date ON coaching_habit_logs(log_date);

-- ============================================================
-- RLS Politikaları
-- ============================================================
ALTER TABLE coaching_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_habit_logs ENABLE ROW LEVEL SECURITY;

-- Coaching Profiles: Tutor full access, student read own
CREATE POLICY "coaching_profiles_tutor_all" ON coaching_profiles
  FOR ALL USING (tutor_id = auth.uid());
CREATE POLICY "coaching_profiles_student_read" ON coaching_profiles
  FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Coaching Goals: Tutor full access, student read own
CREATE POLICY "coaching_goals_tutor_all" ON coaching_goals
  FOR ALL USING (tutor_id = auth.uid());
CREATE POLICY "coaching_goals_student_read" ON coaching_goals
  FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Coaching Milestones: via goal ownership
CREATE POLICY "coaching_milestones_tutor_all" ON coaching_milestones
  FOR ALL USING (goal_id IN (SELECT id FROM coaching_goals WHERE tutor_id = auth.uid()));
CREATE POLICY "coaching_milestones_student_read" ON coaching_milestones
  FOR SELECT USING (goal_id IN (SELECT id FROM coaching_goals WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())));

-- Coaching Sessions: Tutor full access, student read own
CREATE POLICY "coaching_sessions_tutor_all" ON coaching_sessions
  FOR ALL USING (tutor_id = auth.uid());
CREATE POLICY "coaching_sessions_student_read" ON coaching_sessions
  FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Daily Study Logs: Student write own, tutor read/comment
CREATE POLICY "daily_study_logs_student_all" ON daily_study_logs
  FOR ALL USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "daily_study_logs_tutor_read" ON daily_study_logs
  FOR SELECT USING (student_id IN (SELECT id FROM students WHERE tutor_id = auth.uid()));
CREATE POLICY "daily_study_logs_tutor_comment" ON daily_study_logs
  FOR UPDATE USING (student_id IN (SELECT id FROM students WHERE tutor_id = auth.uid()));

-- Coaching Habits: Tutor full access, student read own
CREATE POLICY "coaching_habits_tutor_all" ON coaching_habits
  FOR ALL USING (tutor_id = auth.uid());
CREATE POLICY "coaching_habits_student_read" ON coaching_habits
  FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Coaching Habit Logs: Student write own, tutor read
CREATE POLICY "coaching_habit_logs_student_all" ON coaching_habit_logs
  FOR ALL USING (habit_id IN (SELECT id FROM coaching_habits WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())));
CREATE POLICY "coaching_habit_logs_tutor_read" ON coaching_habit_logs
  FOR SELECT USING (habit_id IN (SELECT id FROM coaching_habits WHERE tutor_id = auth.uid()));
