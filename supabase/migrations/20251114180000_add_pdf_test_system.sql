/*
  # PDF Test System

  1. New Tables
    - `pdf_tests`
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, references users)
      - `student_id` (uuid, references students)
      - `title` (text)
      - `description` (text)
      - `pdf_url` (text) - Supabase Storage URL
      - `total_questions` (integer)
      - `answer_key` (jsonb) - {"1": "A", "2": "C", ...}
      - `options_per_question` (integer) - 4 or 5
      - `duration_minutes` (integer)
      - `due_date` (timestamptz)
      - `created_at` (timestamptz)
      - `subject` (text)
      - `unit` (text)

    - `pdf_test_submissions`
      - `id` (uuid, primary key)
      - `pdf_test_id` (uuid, references pdf_tests)
      - `student_id` (uuid, references students)
      - `student_answers` (jsonb) - {"1": "A", "2": "C", ...}
      - `started_at` (timestamptz)
      - `submitted_at` (timestamptz)
      - `time_spent_seconds` (integer)
      - `score_percentage` (numeric)
      - `correct_count` (integer)
      - `wrong_count` (integer)
      - `empty_count` (integer)
      - `status` (text) - 'started', 'completed', 'time_expired'
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Teachers can manage their own tests
    - Students can view tests assigned to them
    - Students can submit their own test answers
*/

-- Create pdf_tests table
CREATE TABLE IF NOT EXISTS pdf_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  pdf_url text NOT NULL,
  total_questions integer NOT NULL CHECK (total_questions > 0 AND total_questions <= 200),
  answer_key jsonb NOT NULL DEFAULT '{}',
  options_per_question integer NOT NULL DEFAULT 5 CHECK (options_per_question IN (4, 5)),
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  due_date timestamptz,
  subject text DEFAULT '',
  unit text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create pdf_test_submissions table
CREATE TABLE IF NOT EXISTS pdf_test_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_test_id uuid NOT NULL REFERENCES pdf_tests(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_answers jsonb NOT NULL DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  time_spent_seconds integer DEFAULT 0,
  score_percentage numeric(5,2),
  correct_count integer DEFAULT 0,
  wrong_count integer DEFAULT 0,
  empty_count integer DEFAULT 0,
  status text DEFAULT 'started' CHECK (status IN ('started', 'completed', 'time_expired')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(pdf_test_id, student_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pdf_tests_teacher_id ON pdf_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_pdf_tests_student_id ON pdf_tests(student_id);
CREATE INDEX IF NOT EXISTS idx_pdf_test_submissions_pdf_test_id ON pdf_test_submissions(pdf_test_id);
CREATE INDEX IF NOT EXISTS idx_pdf_test_submissions_student_id ON pdf_test_submissions(student_id);

-- Enable RLS
ALTER TABLE pdf_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_test_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdf_tests

-- Teachers can view their own tests
CREATE POLICY "Teachers can view own tests"
  ON pdf_tests FOR SELECT
  TO authenticated
  USING (auth.uid() = teacher_id);

-- Teachers can create tests
CREATE POLICY "Teachers can create tests"
  ON pdf_tests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their own tests
CREATE POLICY "Teachers can update own tests"
  ON pdf_tests FOR UPDATE
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Teachers can delete their own tests
CREATE POLICY "Teachers can delete own tests"
  ON pdf_tests FOR DELETE
  TO authenticated
  USING (auth.uid() = teacher_id);

-- Students can view tests assigned to them
CREATE POLICY "Students can view assigned tests"
  ON pdf_tests FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- RLS Policies for pdf_test_submissions

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions"
  ON pdf_test_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Students can create submissions
CREATE POLICY "Students can create submissions"
  ON pdf_test_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

-- Students can update their own submissions (before completion)
CREATE POLICY "Students can update own submissions"
  ON pdf_test_submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id AND status = 'started')
  WITH CHECK (auth.uid() = student_id);

-- Teachers can view submissions for their tests
CREATE POLICY "Teachers can view test submissions"
  ON pdf_test_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pdf_tests
      WHERE pdf_tests.id = pdf_test_submissions.pdf_test_id
      AND pdf_tests.teacher_id = auth.uid()
    )
  );
