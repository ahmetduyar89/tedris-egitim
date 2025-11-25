/*
  # Initial Schema for Private Tutoring System

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `role` (text) - 'tutor' or 'student'
      - `created_at` (timestamptz)
    
    - `students`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `grade` (integer)
      - `tutor_id` (uuid, references users)
      - `contact` (text)
      - `level` (integer, default 1)
      - `xp` (integer, default 0)
      - `learning_loop_status` (text)
      - `created_at` (timestamptz)
    
    - `badges`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `title` (text)
      - `icon` (text)
      - `description` (text)
      - `earned_at` (timestamptz)
    
    - `progress_reports`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `week_start_date` (date)
      - `last_score` (numeric)
      - `current_score` (numeric)
      - `progress` (numeric)
      - `ai_comment` (text)
      - `focus_topics` (jsonb)
      - `created_at` (timestamptz)
    
    - `tests`
      - `id` (uuid, primary key)
      - `title` (text)
      - `student_id` (uuid, references students)
      - `subject` (text)
      - `unit` (text)
      - `questions` (jsonb)
      - `duration` (integer)
      - `due_date` (timestamptz)
      - `completed` (boolean, default false)
      - `score` (numeric)
      - `analysis` (jsonb)
      - `submission_date` (timestamptz)
      - `created_at` (timestamptz)
    
    - `weekly_programs`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `week` (integer)
      - `days` (jsonb)
      - `created_at` (timestamptz)
    
    - `review_packages`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `topic` (text)
      - `items` (jsonb)
      - `created_at` (timestamptz)
    
    - `notifications`
      - `id` (uuid, primary key)
      - `recipient_id` (uuid, references users)
      - `message` (text)
      - `read` (boolean, default false)
      - `timestamp` (timestamptz)
      - `entity_type` (text)
      - `entity_id` (uuid)
    
    - `content_library`
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, references users)
      - `title` (text)
      - `subject` (text)
      - `grade` (integer)
      - `unit` (text)
      - `tags` (jsonb)
      - `file_type` (text)
      - `file_url` (text)
      - `html_content` (text)
      - `interactive_content_id` (uuid)
      - `created_at` (timestamptz)
    
    - `content_assignments`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `content_id` (uuid, references content_library)
      - `assigned_at` (timestamptz)
      - `viewed` (boolean, default false)
    
    - `interactive_content`
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, references users)
      - `title` (text)
      - `components` (jsonb)
      - `created_at` (timestamptz)
    
    - `assignments`
      - `id` (uuid, primary key)
      - `teacher_id` (uuid, references users)
      - `student_id` (uuid, references students)
      - `subject` (text)
      - `title` (text)
      - `description` (text)
      - `due_date` (timestamptz)
      - `ai_suggested` (boolean, default false)
      - `viewed_by_student` (boolean, default false)
      - `created_at` (timestamptz)
    
    - `submissions`
      - `id` (uuid, primary key)
      - `assignment_id` (uuid, references assignments)
      - `student_id` (uuid, references students)
      - `submission_text` (text)
      - `file_url` (text)
      - `submitted_at` (timestamptz)
      - `status` (text)
      - `ai_score` (numeric)
      - `ai_analysis` (jsonb)
      - `teacher_score` (numeric)
      - `teacher_feedback` (text)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references students)
      - `sender` (text) - 'user' or 'ai'
      - `text` (text)
      - `image_url` (text)
      - `explanation` (jsonb)
      - `feedback` (jsonb)
      - `timestamp` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for tutors to access their students' data
*/

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('tutor', 'student')),
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  grade integer NOT NULL,
  tutor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  contact text,
  level integer DEFAULT 1,
  xp integer DEFAULT 0,
  learning_loop_status text DEFAULT 'Başlangıç',
  created_at timestamptz DEFAULT now()
);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  title text NOT NULL,
  icon text NOT NULL,
  description text NOT NULL,
  earned_at timestamptz DEFAULT now()
);

-- Create progress_reports table
CREATE TABLE IF NOT EXISTS progress_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  last_score numeric NOT NULL DEFAULT 0,
  current_score numeric NOT NULL DEFAULT 0,
  progress numeric NOT NULL DEFAULT 0,
  ai_comment text,
  focus_topics jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  unit text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration integer NOT NULL,
  due_date timestamptz NOT NULL,
  completed boolean DEFAULT false,
  score numeric,
  analysis jsonb,
  submission_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create weekly_programs table
CREATE TABLE IF NOT EXISTS weekly_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  week integer NOT NULL,
  days jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create review_packages table
CREATE TABLE IF NOT EXISTS review_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  topic text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean DEFAULT false,
  timestamp timestamptz DEFAULT now(),
  entity_type text,
  entity_id uuid
);

-- Create content_library table
CREATE TABLE IF NOT EXISTS content_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text NOT NULL,
  grade integer NOT NULL,
  unit text NOT NULL,
  tags jsonb DEFAULT '[]'::jsonb,
  file_type text NOT NULL,
  file_url text,
  html_content text,
  interactive_content_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Create content_assignments table
CREATE TABLE IF NOT EXISTS content_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  content_id uuid REFERENCES content_library(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  viewed boolean DEFAULT false
);

-- Create interactive_content table
CREATE TABLE IF NOT EXISTS interactive_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  components jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  due_date timestamptz NOT NULL,
  ai_suggested boolean DEFAULT false,
  viewed_by_student boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  submission_text text,
  file_url text,
  submitted_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'Bekliyor',
  ai_score numeric,
  ai_analysis jsonb,
  teacher_score numeric,
  teacher_feedback text
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user', 'ai')),
  text text,
  image_url text,
  explanation jsonb,
  feedback jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactive_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Students policies
CREATE POLICY "Students can view own data"
  ON students FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Tutors can view their students"
  ON students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'tutor'
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can update their students"
  ON students FOR UPDATE
  TO authenticated
  USING (tutor_id = auth.uid())
  WITH CHECK (tutor_id = auth.uid());

CREATE POLICY "Tutors can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'tutor'
      AND students.tutor_id = auth.uid()
    )
  );

-- Badges policies
CREATE POLICY "Students can view own badges"
  ON badges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.id = auth.uid()
    )
  );

CREATE POLICY "Tutors can view their students' badges"
  ON badges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can insert badges for their students"
  ON badges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

-- Progress reports policies
CREATE POLICY "Students can view own progress reports"
  ON progress_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.id = auth.uid()
    )
  );

CREATE POLICY "Tutors can view their students' progress reports"
  ON progress_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can insert progress reports"
  ON progress_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

-- Tests policies
CREATE POLICY "Students can view own tests"
  ON tests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.id = auth.uid()
    )
  );

CREATE POLICY "Students can update own tests"
  ON tests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.id = auth.uid()
    )
  );

CREATE POLICY "Tutors can view their students' tests"
  ON tests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can insert tests"
  ON tests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can update their students' tests"
  ON tests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

-- Weekly programs policies
CREATE POLICY "Students can view own weekly programs"
  ON weekly_programs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.id = auth.uid()
    )
  );

CREATE POLICY "Tutors can view their students' weekly programs"
  ON weekly_programs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can insert weekly programs"
  ON weekly_programs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can update weekly programs"
  ON weekly_programs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

-- Review packages policies
CREATE POLICY "Students can view own review packages"
  ON review_packages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.id = auth.uid()
    )
  );

CREATE POLICY "Tutors can view their students' review packages"
  ON review_packages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can insert review packages"
  ON review_packages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Content library policies
CREATE POLICY "Teachers can view own content"
  ON content_library FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert content"
  ON content_library FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own content"
  ON content_library FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own content"
  ON content_library FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can view assigned content"
  ON content_library FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM content_assignments
      WHERE content_assignments.content_id = content_library.id
      AND content_assignments.student_id = auth.uid()
    )
  );

-- Content assignments policies
CREATE POLICY "Students can view own content assignments"
  ON content_assignments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can update own content assignments"
  ON content_assignments FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view their students' content assignments"
  ON content_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert content assignments"
  ON content_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_id
      AND students.tutor_id = auth.uid()
    )
  );

-- Interactive content policies
CREATE POLICY "Teachers can view own interactive content"
  ON interactive_content FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert interactive content"
  ON interactive_content FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own interactive content"
  ON interactive_content FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Assignments policies
CREATE POLICY "Students can view own assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can update own assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view own assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Submissions policies
CREATE POLICY "Students can view own submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own submissions"
  ON submissions FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view their students' submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update their students' submissions"
  ON submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = assignment_id
      AND assignments.teacher_id = auth.uid()
    )
  );

-- Chat messages policies
CREATE POLICY "Students can view own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_tutor_id ON students(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tests_student_id ON tests(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_content_library_teacher_id ON content_library(teacher_id);