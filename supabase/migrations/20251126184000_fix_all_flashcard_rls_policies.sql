/*
  # Fix All Flashcard System RLS Policies
  
  Problem: 
  - Teachers cannot create flashcards (INSERT policy missing)
  - Students cannot record reviews (INSERT policy missing for flashcard_reviews)
  - Students cannot update schedule (UPDATE policy might be missing)
  
  Solution: Add comprehensive RLS policies for all flashcard-related tables
*/

-- ============================================
-- FLASHCARDS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Teachers can manage own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Students can view assigned flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Teachers can view own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Teachers can insert flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Teachers can update own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Teachers can delete own flashcards" ON public.flashcards;

-- Create new policies
CREATE POLICY "Teachers can view own flashcards"
  ON public.flashcards
  FOR SELECT
  TO authenticated
  USING (teacher_id = (SELECT auth.uid()));

CREATE POLICY "Students can view assigned flashcards"
  ON public.flashcards
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT flashcard_id 
      FROM public.spaced_repetition_schedule
      WHERE student_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Teachers can insert flashcards"
  ON public.flashcards
  FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = (SELECT auth.uid()));

CREATE POLICY "Teachers can update own flashcards"
  ON public.flashcards
  FOR UPDATE
  TO authenticated
  USING (teacher_id = (SELECT auth.uid()))
  WITH CHECK (teacher_id = (SELECT auth.uid()));

CREATE POLICY "Teachers can delete own flashcards"
  ON public.flashcards
  FOR DELETE
  TO authenticated
  USING (teacher_id = (SELECT auth.uid()));

-- ============================================
-- SPACED_REPETITION_SCHEDULE TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view own schedule" ON public.spaced_repetition_schedule;
DROP POLICY IF EXISTS "Students can update own schedule" ON public.spaced_repetition_schedule;
DROP POLICY IF EXISTS "Tutors can manage schedules" ON public.spaced_repetition_schedule;
DROP POLICY IF EXISTS "Tutors can view their students' schedules" ON public.spaced_repetition_schedule;
DROP POLICY IF EXISTS "Tutors can insert schedules for their students" ON public.spaced_repetition_schedule;
DROP POLICY IF EXISTS "Users can view schedules" ON public.spaced_repetition_schedule;
DROP POLICY IF EXISTS "Users can update schedules" ON public.spaced_repetition_schedule;

-- Create new policies
CREATE POLICY "Students can view own schedule"
  ON public.spaced_repetition_schedule
  FOR SELECT
  TO authenticated
  USING (student_id = (SELECT auth.uid()));

CREATE POLICY "Teachers can view student schedules"
  ON public.spaced_repetition_schedule
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = spaced_repetition_schedule.student_id
      AND students.tutor_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Teachers can insert schedules"
  ON public.spaced_repetition_schedule
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = spaced_repetition_schedule.student_id
      AND students.tutor_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Students can update own schedule"
  ON public.spaced_repetition_schedule
  FOR UPDATE
  TO authenticated
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY "Teachers can update student schedules"
  ON public.spaced_repetition_schedule
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = spaced_repetition_schedule.student_id
      AND students.tutor_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = spaced_repetition_schedule.student_id
      AND students.tutor_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- FLASHCARD_REVIEWS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view flashcard reviews" ON public.flashcard_reviews;
DROP POLICY IF EXISTS "Students can manage own reviews" ON public.flashcard_reviews;
DROP POLICY IF EXISTS "Students can view own reviews" ON public.flashcard_reviews;
DROP POLICY IF EXISTS "Teachers can view flashcard reviews" ON public.flashcard_reviews;
DROP POLICY IF EXISTS "Students can insert own reviews" ON public.flashcard_reviews;
DROP POLICY IF EXISTS "Students can update own reviews" ON public.flashcard_reviews;
DROP POLICY IF EXISTS "Students can delete own reviews" ON public.flashcard_reviews;
DROP POLICY IF EXISTS "Tutors can view student reviews" ON public.flashcard_reviews;

-- Create new policies
CREATE POLICY "Students can view own reviews"
  ON public.flashcard_reviews
  FOR SELECT
  TO authenticated
  USING (student_id = (SELECT auth.uid()));

CREATE POLICY "Teachers can view student reviews"
  ON public.flashcard_reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.flashcards f
      WHERE f.id = flashcard_reviews.flashcard_id
      AND f.teacher_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Students can insert own reviews"
  ON public.flashcard_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY "Students can update own reviews"
  ON public.flashcard_reviews
  FOR UPDATE
  TO authenticated
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (student_id = (SELECT auth.uid()));

CREATE POLICY "Students can delete own reviews"
  ON public.flashcard_reviews
  FOR DELETE
  TO authenticated
  USING (student_id = (SELECT auth.uid()));
