/*
  # Consolidate Question Banks Multiple Permissive Policies

  1. Performance & Security Improvement
    - Consolidates two SELECT policies into one for better performance
    - Reduces policy evaluation overhead
    - Maintains same access control logic

  2. Policies Consolidated
    - "Students can view assigned question banks" (SELECT only)
    - "Teachers can manage own question banks" (ALL operations)
    
  3. New Policy Structure
    - Single SELECT policy: Teachers own OR students assigned
    - Separate policies for INSERT, UPDATE, DELETE (teachers only)

  4. Logic
    - Teachers can view question banks they created
    - Students can view question banks assigned to them
    - Only teachers can create, update, or delete their own question banks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view assigned question banks" ON public.question_banks;
DROP POLICY IF EXISTS "Teachers can manage own question banks" ON public.question_banks;

-- Create consolidated SELECT policy
CREATE POLICY "Users can view question banks"
  ON public.question_banks
  FOR SELECT
  TO authenticated
  USING (
    teacher_id = (SELECT auth.uid())
    OR
    EXISTS (
      SELECT 1 
      FROM public.question_bank_assignments
      WHERE question_bank_assignments.question_bank_id = question_banks.id
      AND question_bank_assignments.student_id = (SELECT auth.uid())
    )
  );

-- Create separate policies for teachers to manage their own question banks
CREATE POLICY "Teachers can insert own question banks"
  ON public.question_banks
  FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = (SELECT auth.uid()));

CREATE POLICY "Teachers can update own question banks"
  ON public.question_banks
  FOR UPDATE
  TO authenticated
  USING (teacher_id = (SELECT auth.uid()))
  WITH CHECK (teacher_id = (SELECT auth.uid()));

CREATE POLICY "Teachers can delete own question banks"
  ON public.question_banks
  FOR DELETE
  TO authenticated
  USING (teacher_id = (SELECT auth.uid()));
