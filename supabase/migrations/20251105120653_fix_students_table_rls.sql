/*
  # Fix Students Table RLS Policies

  1. Changes
    - Allow authenticated users to insert student records
    - Update read policies to allow tutors to see their students
    - Allow students to read their own data

  2. Security
    - Students can read own data
    - Tutors can read students assigned to them
    - Insert allowed for authenticated users (for signup)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Students can read own data" ON students;
DROP POLICY IF EXISTS "Tutors can read assigned students" ON students;
DROP POLICY IF EXISTS "Tutors can update assigned students" ON students;

-- Allow authenticated users to insert student records (for signup and tutor adding students)
CREATE POLICY "Allow authenticated to insert students"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Students can read their own data
CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Tutors can read students assigned to them
CREATE POLICY "Tutors can read assigned students"
  ON students
  FOR SELECT
  TO authenticated
  USING (auth.uid() = tutor_id);

-- Tutors can update students assigned to them
CREATE POLICY "Tutors can update assigned students"
  ON students
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = tutor_id)
  WITH CHECK (auth.uid() = tutor_id);

-- Students can update their own data
CREATE POLICY "Students can update own data"
  ON students
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
