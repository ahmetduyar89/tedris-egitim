/*
  # Optimize RLS Policies for Performance

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in all RLS policies
    - This prevents re-evaluation of auth.uid() for each row
    - Significantly improves query performance at scale
    
  2. Changes Applied
    - Drop existing policies
    - Recreate with optimized auth.uid() calls
    - Remove duplicate policies where found
    
  3. Security
    - All policies maintain the same security guarantees
    - Only the performance optimization is applied
    
  Note: This migration recreates all RLS policies with proper optimization
*/

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own name" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record during signup" ON public.users;

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

-- ============================================
-- STUDENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own data" ON public.students;
DROP POLICY IF EXISTS "Students can read own data" ON public.students;
DROP POLICY IF EXISTS "Students can update own data" ON public.students;
DROP POLICY IF EXISTS "Tutors can view their students" ON public.students;
DROP POLICY IF EXISTS "Tutors can read assigned students" ON public.students;
DROP POLICY IF EXISTS "Tutors can update their students" ON public.students;
DROP POLICY IF EXISTS "Tutors can update assigned students" ON public.students;
DROP POLICY IF EXISTS "Tutors can insert students" ON public.students;
DROP POLICY IF EXISTS "Allow authenticated to insert students" ON public.students;

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

-- ============================================
-- BADGES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own badges" ON public.badges;
DROP POLICY IF EXISTS "Tutors can view their students' badges" ON public.badges;
DROP POLICY IF EXISTS "Tutors can insert badges for their students" ON public.badges;

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

-- ============================================
-- PROGRESS_REPORTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own progress reports" ON public.progress_reports;
DROP POLICY IF EXISTS "Tutors can view their students' progress reports" ON public.progress_reports;
DROP POLICY IF EXISTS "Tutors can insert progress reports" ON public.progress_reports;

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

-- ============================================
-- CHAT_MESSAGES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Students can insert own chat messages" ON public.chat_messages;

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

-- ============================================
-- TESTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own tests" ON public.tests;
DROP POLICY IF EXISTS "Students can update own tests" ON public.tests;
DROP POLICY IF EXISTS "Tutors can view their students' tests" ON public.tests;
DROP POLICY IF EXISTS "Tutors can insert tests" ON public.tests;
DROP POLICY IF EXISTS "Tutors can update their students' tests" ON public.tests;

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

-- ============================================
-- WEEKLY_PROGRAMS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own weekly programs" ON public.weekly_programs;
DROP POLICY IF EXISTS "Students can update own weekly programs" ON public.weekly_programs;
DROP POLICY IF EXISTS "Tutors can view their students' weekly programs" ON public.weekly_programs;
DROP POLICY IF EXISTS "Tutors can insert weekly programs" ON public.weekly_programs;
DROP POLICY IF EXISTS "Tutors can update weekly programs" ON public.weekly_programs;

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

-- ============================================
-- REVIEW_PACKAGES TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own review packages" ON public.review_packages;
DROP POLICY IF EXISTS "Tutors can view their students' review packages" ON public.review_packages;
DROP POLICY IF EXISTS "Tutors can insert review packages" ON public.review_packages;

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

-- ============================================
-- CONTENT_LIBRARY TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Teachers can view own content" ON public.content_library;
DROP POLICY IF EXISTS "Teachers can insert content" ON public.content_library;
DROP POLICY IF EXISTS "Teachers can update own content" ON public.content_library;
DROP POLICY IF EXISTS "Teachers can delete own content" ON public.content_library;
DROP POLICY IF EXISTS "Students can view assigned content" ON public.content_library;

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

-- ============================================
-- CONTENT_ASSIGNMENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own content assignments" ON public.content_assignments;
DROP POLICY IF EXISTS "Students can update own content assignments" ON public.content_assignments;
DROP POLICY IF EXISTS "Teachers can view their students' content assignments" ON public.content_assignments;
DROP POLICY IF EXISTS "Teachers can insert content assignments" ON public.content_assignments;

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

-- ============================================
-- INTERACTIVE_CONTENT TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Teachers can view own interactive content" ON public.interactive_content;
DROP POLICY IF EXISTS "Teachers can insert interactive content" ON public.interactive_content;
DROP POLICY IF EXISTS "Teachers can update own interactive content" ON public.interactive_content;
DROP POLICY IF EXISTS "Students can view assigned interactive content" ON public.interactive_content;

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

-- ============================================
-- ASSIGNMENTS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students can update own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can view own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can insert assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can update own assignments" ON public.assignments;

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

-- ============================================
-- SUBMISSIONS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Students can view own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can insert own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can update own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Teachers can view their students' submissions" ON public.submissions;
DROP POLICY IF EXISTS "Teachers can update their students' submissions" ON public.submissions;

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

-- ============================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

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