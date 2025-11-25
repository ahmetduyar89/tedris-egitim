/*
  # Final Cleanup of All Old Policies

  1. Purpose
    - Remove ALL old unoptimized policies from initial schema
    - Ensure only optimized policies with (SELECT auth.uid()) remain
    - Fix all Dashboard security warnings
    
  2. Strategy
    - Drop every single policy on every table
    - Recreate ONLY the optimized policies we need
    - Use precise policy names that Dashboard expects
    
  3. Result
    - Zero unoptimized policies
    - Zero duplicate policies
    - All Dashboard warnings resolved
*/

-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================

-- Users table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname);
    END LOOP;
END $$;

-- Students table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'students'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.students', r.policyname);
    END LOOP;
END $$;

-- Badges table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'badges'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.badges', r.policyname);
    END LOOP;
END $$;

-- Progress reports table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'progress_reports'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.progress_reports', r.policyname);
    END LOOP;
END $$;

-- Chat messages table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_messages'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', r.policyname);
    END LOOP;
END $$;

-- Tests table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tests'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.tests', r.policyname);
    END LOOP;
END $$;

-- Weekly programs table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'weekly_programs'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.weekly_programs', r.policyname);
    END LOOP;
END $$;

-- Review packages table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'review_packages'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.review_packages', r.policyname);
    END LOOP;
END $$;

-- Content library table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'content_library'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.content_library', r.policyname);
    END LOOP;
END $$;

-- Content assignments table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'content_assignments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.content_assignments', r.policyname);
    END LOOP;
END $$;

-- Interactive content table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interactive_content'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.interactive_content', r.policyname);
    END LOOP;
END $$;

-- Assignments table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'assignments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.assignments', r.policyname);
    END LOOP;
END $$;

-- Submissions table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'submissions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.submissions', r.policyname);
    END LOOP;
END $$;

-- Notifications table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', r.policyname);
    END LOOP;
END $$;

-- Flashcards table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'flashcards'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.flashcards', r.policyname);
    END LOOP;
END $$;

-- Spaced repetition schedule table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'spaced_repetition_schedule'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.spaced_repetition_schedule', r.policyname);
    END LOOP;
END $$;

-- Flashcard reviews table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'flashcard_reviews'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.flashcard_reviews', r.policyname);
    END LOOP;
END $$;

-- Mini quizzes table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mini_quizzes'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.mini_quizzes', r.policyname);
    END LOOP;
END $$;

-- Question banks table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'question_banks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.question_banks', r.policyname);
    END LOOP;
END $$;

-- Question bank assignments table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'question_bank_assignments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.question_bank_assignments', r.policyname);
    END LOOP;
END $$;

-- ============================================
-- RECREATE OPTIMIZED POLICIES
-- ============================================

-- USERS TABLE
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can insert own record during signup"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- STUDENTS TABLE
CREATE POLICY "Students can read own data"
  ON public.students FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Students can update own data"
  ON public.students FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Tutors can read assigned students"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.role = 'tutor'
      AND students.tutor_id = users.id
    )
  );

CREATE POLICY "Tutors can update assigned students"
  ON public.students FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.role = 'tutor'
      AND students.tutor_id = users.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.role = 'tutor'
      AND students.tutor_id = users.id
    )
  );

CREATE POLICY "Tutors can insert students"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.role = 'tutor'
      AND students.tutor_id = users.id
    )
  );

-- BADGES TABLE
CREATE POLICY "Students can view own badges"
  ON public.badges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = badges.student_id
      AND students.id = (select auth.uid())
    )
  );

CREATE POLICY "Tutors can view their students badges"
  ON public.badges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = badges.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

CREATE POLICY "Tutors can insert badges"
  ON public.badges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = badges.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

-- PROGRESS_REPORTS TABLE
CREATE POLICY "Students can view own progress reports"
  ON public.progress_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = progress_reports.student_id
      AND students.id = (select auth.uid())
    )
  );

CREATE POLICY "Tutors can view progress reports"
  ON public.progress_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = progress_reports.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

CREATE POLICY "Tutors can insert progress reports"
  ON public.progress_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = progress_reports.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

-- CHAT_MESSAGES TABLE
CREATE POLICY "Students can view own chat messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = chat_messages.student_id
      AND students.id = (select auth.uid())
    )
  );

CREATE POLICY "Students can insert chat messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = chat_messages.student_id
      AND students.id = (select auth.uid())
    )
  );

-- TESTS TABLE
CREATE POLICY "Students can view own tests"
  ON public.tests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = tests.student_id
      AND students.id = (select auth.uid())
    )
  );

CREATE POLICY "Students can update own tests"
  ON public.tests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = tests.student_id
      AND students.id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = tests.student_id
      AND students.id = (select auth.uid())
    )
  );

CREATE POLICY "Tutors can view tests"
  ON public.tests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = tests.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

CREATE POLICY "Tutors can insert tests"
  ON public.tests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = tests.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

CREATE POLICY "Tutors can update tests"
  ON public.tests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = tests.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = tests.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

-- WEEKLY_PROGRAMS TABLE
CREATE POLICY "Students can view own weekly programs"
  ON public.weekly_programs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = weekly_programs.student_id
      AND students.id = (select auth.uid())
    )
  );

CREATE POLICY "Students can update own weekly programs"
  ON public.weekly_programs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = weekly_programs.student_id
      AND students.id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = weekly_programs.student_id
      AND students.id = (select auth.uid())
    )
  );

CREATE POLICY "Tutors can view weekly programs"
  ON public.weekly_programs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = weekly_programs.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

CREATE POLICY "Tutors can insert weekly programs"
  ON public.weekly_programs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = weekly_programs.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

CREATE POLICY "Tutors can update weekly programs"
  ON public.weekly_programs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = weekly_programs.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = weekly_programs.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

-- REVIEW_PACKAGES TABLE
CREATE POLICY "Students can view own review packages"
  ON public.review_packages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = review_packages.student_id
      AND students.id = (select auth.uid())
    )
  );

CREATE POLICY "Tutors can view review packages"
  ON public.review_packages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = review_packages.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

CREATE POLICY "Tutors can insert review packages"
  ON public.review_packages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = review_packages.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

-- CONTENT_LIBRARY TABLE
CREATE POLICY "Teachers can manage own content"
  ON public.content_library FOR ALL
  TO authenticated
  USING (teacher_id = (select auth.uid()))
  WITH CHECK (teacher_id = (select auth.uid()));

CREATE POLICY "Students can view assigned content"
  ON public.content_library FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.content_assignments
      JOIN public.students ON students.id = content_assignments.student_id
      WHERE content_assignments.content_id = content_library.id
      AND students.id = (select auth.uid())
    )
  );

-- CONTENT_ASSIGNMENTS TABLE
CREATE POLICY "Students can view own content assignments"
  ON public.content_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = content_assignments.student_id
      AND students.id = (select auth.uid())
    )
  );

CREATE POLICY "Students can update own content assignments"
  ON public.content_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = content_assignments.student_id
      AND students.id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = content_assignments.student_id
      AND students.id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers can manage content assignments"
  ON public.content_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = content_assignments.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = content_assignments.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

-- INTERACTIVE_CONTENT TABLE
CREATE POLICY "Teachers can manage own interactive content"
  ON public.interactive_content FOR ALL
  TO authenticated
  USING (teacher_id = (select auth.uid()))
  WITH CHECK (teacher_id = (select auth.uid()));

CREATE POLICY "Students can view assigned interactive content"
  ON public.interactive_content FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.content_library
      JOIN public.content_assignments ON content_assignments.content_id = content_library.id
      JOIN public.students ON students.id = content_assignments.student_id
      WHERE content_library.interactive_content_id = interactive_content.id
      AND students.id = (select auth.uid())
    )
  );

-- ASSIGNMENTS TABLE
CREATE POLICY "Students can view own assignments"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (student_id = (select auth.uid()));

CREATE POLICY "Students can update own assignments"
  ON public.assignments FOR UPDATE
  TO authenticated
  USING (student_id = (select auth.uid()))
  WITH CHECK (student_id = (select auth.uid()));

CREATE POLICY "Teachers can manage assignments"
  ON public.assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = assignments.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = assignments.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

-- SUBMISSIONS TABLE
CREATE POLICY "Students can manage own submissions"
  ON public.submissions FOR ALL
  TO authenticated
  USING (student_id = (select auth.uid()))
  WITH CHECK (student_id = (select auth.uid()));

CREATE POLICY "Teachers can manage student submissions"
  ON public.submissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = submissions.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      JOIN public.users ON users.id = students.tutor_id
      WHERE students.id = submissions.student_id
      AND users.id = (select auth.uid())
      AND users.role = 'tutor'
    )
  );

-- NOTIFICATIONS TABLE
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (recipient_id = (select auth.uid()));

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = (select auth.uid()))
  WITH CHECK (recipient_id = (select auth.uid()));

CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- FLASHCARDS TABLE
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

-- SPACED_REPETITION_SCHEDULE TABLE
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

-- FLASHCARD_REVIEWS TABLE
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

-- MINI_QUIZZES TABLE
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

-- QUESTION_BANKS TABLE
CREATE POLICY "Teachers can manage own question banks"
  ON public.question_banks FOR ALL
  TO authenticated
  USING (teacher_id = (select auth.uid()))
  WITH CHECK (teacher_id = (select auth.uid()));

-- QUESTION_BANK_ASSIGNMENTS TABLE
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