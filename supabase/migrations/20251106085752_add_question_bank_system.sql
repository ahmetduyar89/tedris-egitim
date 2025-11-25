/*
  # Soru Bankası Sistemi

  1. Yeni Tablolar
    - `question_banks`
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, foreign key → users)
      - `title` (text) - Soru bankası başlığı
      - `subject` (text) - Ders adı
      - `grade` (integer) - Sınıf seviyesi
      - `unit` (text) - Ünite adı
      - `topic` (text) - Konu (opsiyonel)
      - `difficulty_level` (integer) - 1-5 arası zorluk
      - `questions` (jsonb) - Soru dizisi
      - `total_questions` (integer) - Toplam soru sayısı
      - `source` (text) - 'ai_generated' | 'pdf_import' | 'manual'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `question_bank_assignments`
      - `id` (uuid, primary key)
      - `question_bank_id` (uuid, foreign key → question_banks)
      - `student_id` (uuid, foreign key → students)
      - `teacher_id` (uuid, foreign key → users)
      - `assigned_at` (timestamptz)
      - `due_date` (timestamptz)
      - `time_limit_minutes` (integer) - Test süresi
      - `started_at` (timestamptz) - Öğrenci başlama zamanı
      - `completed_at` (timestamptz)
      - `answers` (jsonb) - Öğrenci cevapları
      - `score` (numeric)
      - `total_correct` (integer)
      - `total_questions` (integer)
      - `status` (text) - 'Atandı' | 'Devam Ediyor' | 'Tamamlandı'
      - `ai_feedback` (jsonb)

  2. Güvenlik
    - RLS her iki tablo için aktif
    - Öğretmenler kendi soru bankalarını yönetebilir
    - Öğrenciler sadece kendilerine atanan testleri görebilir
*/

-- Soru Bankası Tablosu
CREATE TABLE IF NOT EXISTS question_banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text NOT NULL,
  grade integer NOT NULL,
  unit text NOT NULL,
  topic text,
  difficulty_level integer DEFAULT 3 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_questions integer DEFAULT 0,
  source text DEFAULT 'ai_generated' CHECK (source IN ('ai_generated', 'pdf_import', 'manual')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Soru Bankası Atamaları Tablosu
CREATE TABLE IF NOT EXISTS question_bank_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_bank_id uuid REFERENCES question_banks(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  due_date timestamptz,
  time_limit_minutes integer,
  started_at timestamptz,
  completed_at timestamptz,
  answers jsonb DEFAULT '{}'::jsonb,
  score numeric,
  total_correct integer DEFAULT 0,
  total_questions integer DEFAULT 0,
  status text DEFAULT 'Atandı' CHECK (status IN ('Atandı', 'Devam Ediyor', 'Tamamlandı')),
  ai_feedback jsonb
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_question_banks_teacher ON question_banks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_question_banks_subject_grade ON question_banks(subject, grade);
CREATE INDEX IF NOT EXISTS idx_qb_assignments_student ON question_bank_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_qb_assignments_teacher ON question_bank_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_qb_assignments_status ON question_bank_assignments(status);

-- RLS Politikaları

-- question_banks tablosu
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own question banks"
  ON question_banks FOR SELECT
  TO authenticated
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create question banks"
  ON question_banks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own question banks"
  ON question_banks FOR UPDATE
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own question banks"
  ON question_banks FOR DELETE
  TO authenticated
  USING (auth.uid() = teacher_id);

-- question_bank_assignments tablosu
ALTER TABLE question_bank_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own assignments"
  ON question_bank_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view own assignments"
  ON question_bank_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = question_bank_assignments.student_id
      AND students.id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create assignments"
  ON question_bank_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own assignments"
  ON question_bank_assignments FOR UPDATE
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Students can update own assignment answers"
  ON question_bank_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = question_bank_assignments.student_id
      AND students.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = question_bank_assignments.student_id
      AND students.id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete own assignments"
  ON question_bank_assignments FOR DELETE
  TO authenticated
  USING (auth.uid() = teacher_id);