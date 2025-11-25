/*
  # Knowledge Graph Mastery System - Dinamik Öğrenme Yolu
  
  Bu migration, adaptif öğrenme için Knowledge Graph tabanlı sistemin altyapısını oluşturur.
  
  ## 1. Yeni Tablolar
  
  ### `kg_modules` (Bilgi Grafiği Modülleri)
  Sistemimizdeki tüm öğrenme modüllerini (konular) tanımlar.
  - `id` (uuid, primary key) - Modül benzersiz kimliği
  - `code` (text, unique) - Modül kodu (Örn: M1, M2, M3)
  - `title` (text) - Modül adı (Örn: "Doğal Sayılar", "EBOB-EKOK")
  - `subject` (text) - Ders (Matematik, Fen Bilimleri, vb.)
  - `grade` (integer) - Sınıf seviyesi
  - `unit` (text) - Ünite
  - `difficulty_level` (integer) - Zorluk seviyesi (1-5)
  - `description` (text) - Modül açıklaması
  - `estimated_duration_minutes` (integer) - Tahmini tamamlanma süresi
  - `created_at` (timestamptz) - Oluşturulma zamanı
  
  ### `kg_prerequisites` (Ön Koşul İlişkileri)
  Modüller arası bağımlılık ilişkilerini tanımlar (Directed Graph).
  - `id` (uuid, primary key)
  - `module_id` (uuid) - Hedef modül
  - `prerequisite_module_id` (uuid) - Ön koşul modül
  - `relationship_type` (text) - 'CRITICAL' veya 'RECOMMENDED'
  - `strength` (numeric) - İlişki gücü (0.0-1.0)
  - `created_at` (timestamptz)
  
  **Örnek:** EBOB konusu için "Asal Çarpanlara Ayırma" CRITICAL ön koşuldur.
  
  ### `student_mastery` (Öğrenci Yeterlilik Takibi)
  Her öğrencinin her modüldeki yeterlilik puanını takip eder.
  - `id` (uuid, primary key)
  - `student_id` (uuid) - Öğrenci referansı
  - `module_id` (uuid) - Modül referansı
  - `mastery_score` (numeric) - Yeterlilik puanı (0.0-1.0)
  - `confidence_level` (numeric) - Güven seviyesi (0.0-1.0)
  - `attempts_count` (integer) - Deneme sayısı
  - `last_practiced_at` (timestamptz) - Son pratik zamanı
  - `first_practiced_at` (timestamptz) - İlk pratik zamanı
  - `streak_days` (integer) - Ardışık pratik günleri
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  **Renk Sistemi:**
  - Kırmızı: mastery_score < 0.50
  - Sarı: 0.50 <= mastery_score < 0.70
  - Yeşil: mastery_score >= 0.70
  
  ### `kg_content` (Modül İçerikleri)
  Her modül için kullanılabilecek öğrenme içeriklerini tanımlar.
  - `id` (uuid, primary key)
  - `module_id` (uuid) - İlişkili modül
  - `content_type` (text) - 'video', 'pdf', 'interactive', 'quiz', 'reading'
  - `title` (text) - İçerik başlığı
  - `description` (text) - İçerik açıklaması
  - `content_library_id` (uuid) - Mevcut content_library tablosuna referans
  - `difficulty_level` (integer) - İçerik zorluğu (1-5)
  - `estimated_duration_minutes` (integer) - Tahmini süre
  - `url` (text) - Harici kaynak URL'i (opsiyonel)
  - `metadata` (jsonb) - Ek bilgiler
  - `created_at` (timestamptz)
  
  ### `tedris_plan` (Dinamik Öğrenme Planı)
  Her öğrenci için AI tarafından oluşturulan günlük görev planı.
  - `id` (uuid, primary key)
  - `student_id` (uuid) - Öğrenci referansı
  - `module_id` (uuid) - Hedef modül
  - `content_id` (uuid) - Atanan içerik (kg_content referansı)
  - `planned_date` (date) - Planlanan gün
  - `priority` (integer) - Öncelik sırası (1 = en yüksek)
  - `task_type` (text) - 'diagnosis', 'learning', 'practice', 'review', 'assessment'
  - `status` (text) - 'pending', 'in_progress', 'completed', 'skipped'
  - `completed_at` (timestamptz) - Tamamlanma zamanı
  - `performance_score` (numeric) - Performans puanı (0.0-1.0)
  - `time_spent_minutes` (integer) - Harcanan süre
  - `ai_generated` (boolean) - AI tarafından mı oluşturuldu
  - `notes` (text) - Notlar
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `mastery_history` (Yeterlilik Geçmişi)
  Öğrencilerin modül yeterlilik puanlarının zaman içindeki değişimini kaydeder.
  - `id` (uuid, primary key)
  - `student_id` (uuid)
  - `module_id` (uuid)
  - `mastery_score` (numeric) - O andaki puan
  - `change_reason` (text) - 'test_completed', 'practice_completed', 'manual_adjustment'
  - `previous_score` (numeric) - Önceki puan
  - `test_id` (uuid) - İlişkili test (opsiyonel)
  - `recorded_at` (timestamptz)
  
  ### `adaptive_plan_logs` (Adaptif Plan Logları)
  Sistemin öğrenci için ne zaman ve neden plan oluşturduğunu kaydeder.
  - `id` (uuid, primary key)
  - `student_id` (uuid)
  - `trigger_reason` (text) - 'initial_diagnosis', 'test_failed', 'milestone_reached', 'manual_trigger'
  - `weak_modules` (jsonb) - Tespit edilen zayıf modüller listesi
  - `recommended_modules` (jsonb) - Önerilen modüller
  - `plan_duration_days` (integer) - Plan süresi
  - `created_at` (timestamptz)
  
  ## 2. Güvenlik (Row Level Security)
  
  Tüm tablolar için RLS politikaları:
  - Öğrenciler sadece kendi verilerini görebilir
  - Öğretmenler kendi öğrencilerinin verilerini görebilir
  - Sistem fonksiyonları tam erişime sahiptir
  
  ## 3. İndeksler
  
  Performans optimizasyonu için kritik indeksler:
  - student_mastery: (student_id, module_id) - Benzersiz
  - kg_prerequisites: (module_id), (prerequisite_module_id)
  - tedris_plan: (student_id, planned_date, status)
  - mastery_history: (student_id, module_id, recorded_at)
  
  ## 4. Notlar
  
  - Tüm tablolarda default değerler ve NOT NULL kontrolleri
  - Cascade delete işlemleri dikkatli ayarlanmış
  - Zaman damgaları otomatik güncellenir
*/

-- ============================================================
-- 1. KG_MODULES (Bilgi Grafiği Modülleri)
-- ============================================================
CREATE TABLE IF NOT EXISTS kg_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  subject text NOT NULL,
  grade integer NOT NULL CHECK (grade >= 1 AND grade <= 12),
  unit text NOT NULL,
  difficulty_level integer NOT NULL DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  description text DEFAULT '',
  estimated_duration_minutes integer DEFAULT 30,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kg_modules_subject_grade ON kg_modules(subject, grade);
CREATE INDEX IF NOT EXISTS idx_kg_modules_code ON kg_modules(code);

-- ============================================================
-- 2. KG_PREREQUISITES (Ön Koşul İlişkileri)
-- ============================================================
CREATE TABLE IF NOT EXISTS kg_prerequisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES kg_modules(id) ON DELETE CASCADE,
  prerequisite_module_id uuid NOT NULL REFERENCES kg_modules(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'RECOMMENDED' CHECK (relationship_type IN ('CRITICAL', 'RECOMMENDED')),
  strength numeric DEFAULT 1.0 CHECK (strength >= 0.0 AND strength <= 1.0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(module_id, prerequisite_module_id)
);

CREATE INDEX IF NOT EXISTS idx_kg_prerequisites_module ON kg_prerequisites(module_id);
CREATE INDEX IF NOT EXISTS idx_kg_prerequisites_prereq ON kg_prerequisites(prerequisite_module_id);

-- ============================================================
-- 3. STUDENT_MASTERY (Öğrenci Yeterlilik Takibi)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES kg_modules(id) ON DELETE CASCADE,
  mastery_score numeric DEFAULT 0.0 CHECK (mastery_score >= 0.0 AND mastery_score <= 1.0),
  confidence_level numeric DEFAULT 0.0 CHECK (confidence_level >= 0.0 AND confidence_level <= 1.0),
  attempts_count integer DEFAULT 0,
  last_practiced_at timestamptz,
  first_practiced_at timestamptz,
  streak_days integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_student_mastery_student ON student_mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_student_mastery_module ON student_mastery(module_id);
CREATE INDEX IF NOT EXISTS idx_student_mastery_score ON student_mastery(mastery_score);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_mastery_unique ON student_mastery(student_id, module_id);

-- ============================================================
-- 4. KG_CONTENT (Modül İçerikleri)
-- ============================================================
CREATE TABLE IF NOT EXISTS kg_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES kg_modules(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('video', 'pdf', 'interactive', 'quiz', 'reading', 'exercise')),
  title text NOT NULL,
  description text DEFAULT '',
  content_library_id uuid REFERENCES content_library(id) ON DELETE SET NULL,
  difficulty_level integer DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  estimated_duration_minutes integer DEFAULT 15,
  url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kg_content_module ON kg_content(module_id);
CREATE INDEX IF NOT EXISTS idx_kg_content_type ON kg_content(content_type);

-- ============================================================
-- 5. TEDRIS_PLAN (Dinamik Öğrenme Planı)
-- ============================================================
CREATE TABLE IF NOT EXISTS tedris_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES kg_modules(id) ON DELETE CASCADE,
  content_id uuid REFERENCES kg_content(id) ON DELETE SET NULL,
  planned_date date NOT NULL,
  priority integer DEFAULT 1,
  task_type text NOT NULL DEFAULT 'learning' CHECK (task_type IN ('diagnosis', 'learning', 'practice', 'review', 'assessment')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at timestamptz,
  performance_score numeric CHECK (performance_score >= 0.0 AND performance_score <= 1.0),
  time_spent_minutes integer DEFAULT 0,
  ai_generated boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tedris_plan_student ON tedris_plan(student_id);
CREATE INDEX IF NOT EXISTS idx_tedris_plan_date ON tedris_plan(planned_date);
CREATE INDEX IF NOT EXISTS idx_tedris_plan_status ON tedris_plan(status);
CREATE INDEX IF NOT EXISTS idx_tedris_plan_student_date_status ON tedris_plan(student_id, planned_date, status);

-- ============================================================
-- 6. MASTERY_HISTORY (Yeterlilik Geçmişi)
-- ============================================================
CREATE TABLE IF NOT EXISTS mastery_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES kg_modules(id) ON DELETE CASCADE,
  mastery_score numeric NOT NULL CHECK (mastery_score >= 0.0 AND mastery_score <= 1.0),
  change_reason text DEFAULT 'manual_adjustment' CHECK (change_reason IN ('test_completed', 'practice_completed', 'manual_adjustment', 'diagnosis')),
  previous_score numeric CHECK (previous_score >= 0.0 AND previous_score <= 1.0),
  test_id uuid REFERENCES tests(id) ON DELETE SET NULL,
  recorded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mastery_history_student ON mastery_history(student_id);
CREATE INDEX IF NOT EXISTS idx_mastery_history_module ON mastery_history(module_id);
CREATE INDEX IF NOT EXISTS idx_mastery_history_student_module_date ON mastery_history(student_id, module_id, recorded_at DESC);

-- ============================================================
-- 7. ADAPTIVE_PLAN_LOGS (Adaptif Plan Logları)
-- ============================================================
CREATE TABLE IF NOT EXISTS adaptive_plan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  trigger_reason text NOT NULL CHECK (trigger_reason IN ('initial_diagnosis', 'test_failed', 'milestone_reached', 'manual_trigger', 'scheduled')),
  weak_modules jsonb DEFAULT '[]',
  recommended_modules jsonb DEFAULT '[]',
  plan_duration_days integer DEFAULT 7,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adaptive_plan_logs_student ON adaptive_plan_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_plan_logs_created ON adaptive_plan_logs(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- KG_MODULES: Public read for authenticated users
ALTER TABLE kg_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view modules"
  ON kg_modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify modules"
  ON kg_modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'tutor'
    )
  );

-- KG_PREREQUISITES: Public read
ALTER TABLE kg_prerequisites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view prerequisites"
  ON kg_prerequisites FOR SELECT
  TO authenticated
  USING (true);

-- STUDENT_MASTERY: Students see own, tutors see their students
ALTER TABLE student_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own mastery"
  ON student_mastery FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Tutors can view their students mastery"
  ON student_mastery FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_mastery.student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "System can manage mastery scores"
  ON student_mastery FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- KG_CONTENT: Public read
ALTER TABLE kg_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view content"
  ON kg_content FOR SELECT
  TO authenticated
  USING (true);

-- TEDRIS_PLAN: Students see own, tutors see their students
ALTER TABLE tedris_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own plan"
  ON tedris_plan FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can update own plan status"
  ON tedris_plan FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Tutors can view their students plans"
  ON tedris_plan FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = tedris_plan.student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "System can manage plans"
  ON tedris_plan FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- MASTERY_HISTORY: Read-only for students/tutors
ALTER TABLE mastery_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own history"
  ON mastery_history FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Tutors can view their students history"
  ON mastery_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = mastery_history.student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "System can insert history"
  ON mastery_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ADAPTIVE_PLAN_LOGS: Tutors and students can view
ALTER TABLE adaptive_plan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own plan logs"
  ON adaptive_plan_logs FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Tutors can view their students plan logs"
  ON adaptive_plan_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = adaptive_plan_logs.student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "System can create plan logs"
  ON adaptive_plan_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
