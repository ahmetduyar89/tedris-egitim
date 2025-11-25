/*
  # Fix Content Library RLS Policies
  
  This migration restores the INSERT, UPDATE, and DELETE policies for the content_library table
  that were accidentally removed in previous consolidation migrations.
  
  ## Changes
  
  1. Add INSERT policy for teachers to create content
  2. Add UPDATE policy for teachers to modify their own content
  3. Add DELETE policy for teachers to delete their own content
  4. Add similar policies for interactive_content table
  
  ## Security
  
  - Teachers (tutors) can only INSERT content with their own teacher_id
  - Teachers can only UPDATE/DELETE content they created (teacher_id = auth.uid())
  - Students cannot INSERT, UPDATE, or DELETE content (read-only via SELECT policy)
*/

-- ============================================================
-- CONTENT_LIBRARY POLICIES
-- ============================================================

-- Policy: Teachers can insert their own content
CREATE POLICY "Teachers can insert content"
  ON public.content_library
  FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

-- Policy: Teachers can update their own content
CREATE POLICY "Teachers can update own content"
  ON public.content_library
  FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Policy: Teachers can delete their own content
CREATE POLICY "Teachers can delete own content"
  ON public.content_library
  FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- ============================================================
-- INTERACTIVE_CONTENT POLICIES
-- ============================================================

-- Policy: Teachers can insert their own interactive content
CREATE POLICY "Teachers can insert interactive content"
  ON public.interactive_content
  FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

-- Policy: Teachers can update their own interactive content
CREATE POLICY "Teachers can update own interactive content"
  ON public.interactive_content
  FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Policy: Teachers can delete their own interactive content
CREATE POLICY "Teachers can delete own interactive content"
  ON public.interactive_content
  FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- ============================================================
-- CONTENT_ASSIGNMENTS POLICIES (if missing)
-- ============================================================

-- Policy: Teachers can assign content to their students
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'content_assignments' 
    AND policyname = 'Teachers can assign content'
  ) THEN
    CREATE POLICY "Teachers can assign content"
      ON public.content_assignments
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.students s
          WHERE s.id = content_assignments.student_id
          AND s.tutor_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policy: Teachers can manage their students' assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'content_assignments' 
    AND policyname = 'Teachers can manage assignments'
  ) THEN
    CREATE POLICY "Teachers can manage assignments"
      ON public.content_assignments
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.students s
          WHERE s.id = content_assignments.student_id
          AND s.tutor_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policy: Students can view their assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'content_assignments' 
    AND policyname = 'Students can view own assignments'
  ) THEN
    CREATE POLICY "Students can view own assignments"
      ON public.content_assignments
      FOR SELECT
      TO authenticated
      USING (student_id = auth.uid());
  END IF;
END $$;
