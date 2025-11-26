/*
  # Fix Flashcards RLS Policies
  
  Problem: Teachers cannot create flashcards because INSERT policy is missing
  
  Solution: Add comprehensive RLS policies for flashcards table
  - Teachers can INSERT, UPDATE, DELETE their own flashcards
  - Students can only SELECT flashcards assigned to them
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Teachers can manage own flashcards" ON public.flashcards;

-- Policy 1: Teachers can view their own flashcards
CREATE POLICY "Teachers can view own flashcards"
  ON public.flashcards
  FOR SELECT
  TO authenticated
  USING (teacher_id = (SELECT auth.uid()));

-- Policy 2: Students can view assigned flashcards
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

-- Policy 3: Teachers can insert flashcards
CREATE POLICY "Teachers can insert flashcards"
  ON public.flashcards
  FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = (SELECT auth.uid()));

-- Policy 4: Teachers can update their own flashcards
CREATE POLICY "Teachers can update own flashcards"
  ON public.flashcards
  FOR UPDATE
  TO authenticated
  USING (teacher_id = (SELECT auth.uid()))
  WITH CHECK (teacher_id = (SELECT auth.uid()));

-- Policy 5: Teachers can delete their own flashcards
CREATE POLICY "Teachers can delete own flashcards"
  ON public.flashcards
  FOR DELETE
  TO authenticated
  USING (teacher_id = (SELECT auth.uid()));
