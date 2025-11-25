/*
  # Fix Security and Performance Issues

  ## Changes Made

  ### 1. Add Missing Foreign Key Indexes
  - assignments.teacher_id
  - flashcard_reviews.flashcard_id, schedule_id
  - interactive_content.teacher_id
  - kg_content.content_library_id
  - mastery_history.test_id
  - tedris_plan.content_id, module_id
  - users.approved_by

  ### 2. Optimize RLS Policies (Auth Function Calls)
  Fixed policies to use (select auth.uid()) pattern for better performance:
  - kg_modules: "Only admins can modify modules"
  - student_mastery: "Students can view own mastery", "Tutors can view their students mastery"
  - tedris_plan: "Students can update own plan status", "Students can view own plan", "Tutors can view their students plans"
  - mastery_history: "Students can view own history", "Tutors can view their students history"
  - adaptive_plan_logs: "Students can view own plan logs", "Tutors can view their students plan logs"

  ### 3. Remove Unused Indexes
  Dropped indexes that have not been used in production

  ### 4. Remove Duplicate Indexes
  Dropped duplicate index on student_mastery table
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_flashcard_id ON public.flashcard_reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_schedule_id ON public.flashcard_reviews(schedule_id);
CREATE INDEX IF NOT EXISTS idx_interactive_content_teacher_id ON public.interactive_content(teacher_id);
CREATE INDEX IF NOT EXISTS idx_kg_content_content_library_id ON public.kg_content(content_library_id);
CREATE INDEX IF NOT EXISTS idx_mastery_history_test_id ON public.mastery_history(test_id);
CREATE INDEX IF NOT EXISTS idx_tedris_plan_content_id ON public.tedris_plan(content_id);
CREATE INDEX IF NOT EXISTS idx_tedris_plan_module_id ON public.tedris_plan(module_id);
CREATE INDEX IF NOT EXISTS idx_users_approved_by ON public.users(approved_by);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - FIX AUTH FUNCTION CALLS
-- =====================================================

-- kg_modules: Fix "Only admins can modify modules"
DROP POLICY IF EXISTS "Only admins can modify modules" ON public.kg_modules;
CREATE POLICY "Only admins can modify modules"
  ON public.kg_modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (select auth.uid())
      AND users.role = 'admin'
    )
  );

-- student_mastery: Fix "Students can view own mastery"
DROP POLICY IF EXISTS "Students can view own mastery" ON public.student_mastery;
CREATE POLICY "Students can view own mastery"
  ON public.student_mastery
  FOR SELECT
  TO authenticated
  USING (student_id = (select auth.uid()));

-- student_mastery: Fix "Tutors can view their students mastery"
DROP POLICY IF EXISTS "Tutors can view their students mastery" ON public.student_mastery;
CREATE POLICY "Tutors can view their students mastery"
  ON public.student_mastery
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_mastery.student_id
      AND s.tutor_id = (select auth.uid())
    )
  );

-- tedris_plan: Fix "Students can update own plan status"
DROP POLICY IF EXISTS "Students can update own plan status" ON public.tedris_plan;
CREATE POLICY "Students can update own plan status"
  ON public.tedris_plan
  FOR UPDATE
  TO authenticated
  USING (student_id = (select auth.uid()))
  WITH CHECK (student_id = (select auth.uid()));

-- tedris_plan: Fix "Students can view own plan"
DROP POLICY IF EXISTS "Students can view own plan" ON public.tedris_plan;
CREATE POLICY "Students can view own plan"
  ON public.tedris_plan
  FOR SELECT
  TO authenticated
  USING (student_id = (select auth.uid()));

-- tedris_plan: Fix "Tutors can view their students plans"
DROP POLICY IF EXISTS "Tutors can view their students plans" ON public.tedris_plan;
CREATE POLICY "Tutors can view their students plans"
  ON public.tedris_plan
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = tedris_plan.student_id
      AND s.tutor_id = (select auth.uid())
    )
  );

-- mastery_history: Fix "Students can view own history"
DROP POLICY IF EXISTS "Students can view own history" ON public.mastery_history;
CREATE POLICY "Students can view own history"
  ON public.mastery_history
  FOR SELECT
  TO authenticated
  USING (student_id = (select auth.uid()));

-- mastery_history: Fix "Tutors can view their students history"
DROP POLICY IF EXISTS "Tutors can view their students history" ON public.mastery_history;
CREATE POLICY "Tutors can view their students history"
  ON public.mastery_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = mastery_history.student_id
      AND s.tutor_id = (select auth.uid())
    )
  );

-- adaptive_plan_logs: Fix "Students can view own plan logs"
DROP POLICY IF EXISTS "Students can view own plan logs" ON public.adaptive_plan_logs;
CREATE POLICY "Students can view own plan logs"
  ON public.adaptive_plan_logs
  FOR SELECT
  TO authenticated
  USING (student_id = (select auth.uid()));

-- adaptive_plan_logs: Fix "Tutors can view their students plan logs"
DROP POLICY IF EXISTS "Tutors can view their students plan logs" ON public.adaptive_plan_logs;
CREATE POLICY "Tutors can view their students plan logs"
  ON public.adaptive_plan_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = adaptive_plan_logs.student_id
      AND s.tutor_id = (select auth.uid())
    )
  );

-- =====================================================
-- 3. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_flashcards_teacher_id;
DROP INDEX IF EXISTS public.idx_qb_assignments_question_bank_id;
DROP INDEX IF EXISTS public.idx_review_packages_student_id;
DROP INDEX IF EXISTS public.idx_spaced_schedule_flashcard_id;
DROP INDEX IF EXISTS public.idx_submissions_student_id;
DROP INDEX IF EXISTS public.idx_weekly_programs_student_id;
DROP INDEX IF EXISTS public.idx_kg_modules_subject_grade;
DROP INDEX IF EXISTS public.idx_kg_prerequisites_prereq;
DROP INDEX IF EXISTS public.idx_student_mastery_student;
DROP INDEX IF EXISTS public.idx_student_mastery_module;
DROP INDEX IF EXISTS public.idx_kg_content_type;
DROP INDEX IF EXISTS public.idx_tedris_plan_student;
DROP INDEX IF EXISTS public.idx_tedris_plan_date;
DROP INDEX IF EXISTS public.idx_mastery_history_student;
DROP INDEX IF EXISTS public.idx_mastery_history_module;
DROP INDEX IF EXISTS public.idx_adaptive_plan_logs_created;

-- =====================================================
-- 4. REMOVE DUPLICATE INDEX
-- =====================================================

-- Keep the unique constraint, drop the redundant index
DROP INDEX IF EXISTS public.idx_student_mastery_unique;
