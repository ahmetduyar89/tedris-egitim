/*
  # Optimize RLS Policies - Auth Function Initialization

  1. Performance Improvement
    - Wraps auth.uid() calls in (SELECT auth.uid()) to evaluate once per query
    - Prevents re-evaluation for each row, dramatically improving performance at scale
    - Applies to public_content_shares and question_banks tables

  2. Tables Updated
    - `public_content_shares`: 4 policies updated (create, view, update, delete)
    - `question_banks`: 1 policy updated (students view assigned)

  3. Security
    - No security changes - only performance optimization
    - Same access control logic, better performance

  4. Notes
    - The question_bank_assignments.student_id directly matches auth.uid()
    - This indicates student_id stores the user's auth.uid(), not a students table reference
*/

-- Drop and recreate public_content_shares policies with optimized auth checks
DROP POLICY IF EXISTS "Tutors can create shares for own content" ON public.public_content_shares;
DROP POLICY IF EXISTS "Tutors can view own shares" ON public.public_content_shares;
DROP POLICY IF EXISTS "Tutors can update own shares" ON public.public_content_shares;
DROP POLICY IF EXISTS "Tutors can delete own shares" ON public.public_content_shares;

CREATE POLICY "Tutors can create shares for own content"
  ON public.public_content_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
  );

CREATE POLICY "Tutors can view own shares"
  ON public.public_content_shares
  FOR SELECT
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
  );

CREATE POLICY "Tutors can update own shares"
  ON public.public_content_shares
  FOR UPDATE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
  );

CREATE POLICY "Tutors can delete own shares"
  ON public.public_content_shares
  FOR DELETE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
  );

-- Drop and recreate question_banks policy with optimized auth check
DROP POLICY IF EXISTS "Students can view assigned question banks" ON public.question_banks;

CREATE POLICY "Students can view assigned question banks"
  ON public.question_banks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.question_bank_assignments
      WHERE question_bank_assignments.question_bank_id = question_banks.id
      AND question_bank_assignments.student_id = (SELECT auth.uid())
    )
  );
