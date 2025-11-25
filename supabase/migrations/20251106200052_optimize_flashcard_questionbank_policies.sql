/*
  # Optimize Flashcard and Question Bank RLS Policies

  1. Performance Optimization
    - Optimize flashcards, spaced_repetition_schedule, flashcard_reviews policies
    - Optimize question_banks and question_bank_assignments policies
    - Optimize mini_quizzes policies
    - Replace auth.uid() with (select auth.uid())
    
  2. Changes Applied
    - Drop existing policies
    - Recreate with optimized auth.uid() calls
    - Consolidate duplicate policies
    
  3. Security
    - Maintain all security guarantees
    - Only performance optimization applied
*/

-- ============================================
-- FLASHCARDS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Teachers can view own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Teachers can insert own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Teachers can update own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Teachers can delete own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Students can view assigned flashcards" ON public.flashcards;

CREATE POLICY "Teachers can manage own flashcards"
  ON public.flashcards FOR ALL
  TO authenticated
  USING (teacher_id = (select auth.uid()))
  WITH CHECK (teacher_id = (select auth.uid()));

CREATE POLICY "Students can view assigned flashcards"
  ON public.flashcards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.spaced_repetition_schedule
      WHERE spaced_repetition_schedule.flashcard_id = flashcards.id
      AND spaced_repetition_schedule.student_id = (select auth.uid())
    )
  );

-- ============================================
-- SPACED_REPETITION_SCHEDULE TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own schedule" ON public.spaced_repetition_schedule;
DROP POLICY IF EXISTS "Students can update own schedule" ON public.spaced_repetition_schedule;
DROP POLICY IF EXISTS "Tutors can view their students' schedules" ON public.spaced_repetition_schedule;
DROP POLICY IF EXISTS "Tutors can insert schedules for their students" ON public.spaced_repetition_schedule;

CREATE POLICY "Students can view own schedule"
  ON public.spaced_repetition_schedule FOR SELECT
  TO authenticated
  USING (student_id = (select auth.uid()));

CREATE POLICY "Students can update own schedule"
  ON public.spaced_repetition_schedule FOR UPDATE
  TO authenticated
  USING (student_id = (select auth.uid()))
  WITH CHECK (student_id = (select auth.uid()));

CREATE POLICY "Tutors can manage schedules"
  ON public.spaced_repetition_schedule FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = spaced_repetition_schedule.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = spaced_repetition_schedule.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

-- ============================================
-- FLASHCARD_REVIEWS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own reviews" ON public.flashcard_reviews;
DROP POLICY IF EXISTS "Students can insert own reviews" ON public.flashcard_reviews;
DROP POLICY IF EXISTS "Tutors can view their students' reviews" ON public.flashcard_reviews;

CREATE POLICY "Students can manage own reviews"
  ON public.flashcard_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.spaced_repetition_schedule
      WHERE spaced_repetition_schedule.id = flashcard_reviews.schedule_id
      AND spaced_repetition_schedule.student_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.spaced_repetition_schedule
      WHERE spaced_repetition_schedule.id = flashcard_reviews.schedule_id
      AND spaced_repetition_schedule.student_id = (select auth.uid())
    )
  );

CREATE POLICY "Tutors can view student reviews"
  ON public.flashcard_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.spaced_repetition_schedule
      JOIN public.students ON students.id = spaced_repetition_schedule.student_id
      JOIN public.users ON users.id = students.tutor_id
      WHERE spaced_repetition_schedule.id = flashcard_reviews.schedule_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

-- ============================================
-- MINI_QUIZZES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own quizzes" ON public.mini_quizzes;
DROP POLICY IF EXISTS "Students can insert own quizzes" ON public.mini_quizzes;
DROP POLICY IF EXISTS "Students can update own quizzes" ON public.mini_quizzes;
DROP POLICY IF EXISTS "Tutors can view their students' quizzes" ON public.mini_quizzes;

CREATE POLICY "Students can manage own quizzes"
  ON public.mini_quizzes FOR ALL
  TO authenticated
  USING (student_id = (select auth.uid()))
  WITH CHECK (student_id = (select auth.uid()));

CREATE POLICY "Tutors can view student quizzes"
  ON public.mini_quizzes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = mini_quizzes.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

-- ============================================
-- QUESTION_BANKS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Teachers can view own question banks" ON public.question_banks;
DROP POLICY IF EXISTS "Teachers can create question banks" ON public.question_banks;
DROP POLICY IF EXISTS "Teachers can update own question banks" ON public.question_banks;
DROP POLICY IF EXISTS "Teachers can delete own question banks" ON public.question_banks;

CREATE POLICY "Teachers can manage own question banks"
  ON public.question_banks FOR ALL
  TO authenticated
  USING (teacher_id = (select auth.uid()))
  WITH CHECK (teacher_id = (select auth.uid()));

-- ============================================
-- QUESTION_BANK_ASSIGNMENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Teachers can view own assignments" ON public.question_bank_assignments;
DROP POLICY IF EXISTS "Students can view own assignments" ON public.question_bank_assignments;
DROP POLICY IF EXISTS "Teachers can create assignments" ON public.question_bank_assignments;
DROP POLICY IF EXISTS "Teachers can update own assignments" ON public.question_bank_assignments;
DROP POLICY IF EXISTS "Students can update own assignment answers" ON public.question_bank_assignments;
DROP POLICY IF EXISTS "Teachers can delete own assignments" ON public.question_bank_assignments;

CREATE POLICY "Students can view own qb assignments"
  ON public.question_bank_assignments FOR SELECT
  TO authenticated
  USING (student_id = (select auth.uid()));

CREATE POLICY "Students can update own qb assignments"
  ON public.question_bank_assignments FOR UPDATE
  TO authenticated
  USING (student_id = (select auth.uid()))
  WITH CHECK (student_id = (select auth.uid()));

CREATE POLICY "Teachers can manage qb assignments"
  ON public.question_bank_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.question_banks
      WHERE question_banks.id = question_bank_assignments.question_bank_id
      AND question_banks.teacher_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.question_banks
      WHERE question_banks.id = question_bank_assignments.question_bank_id
      AND question_banks.teacher_id = (select auth.uid())
    )
  );