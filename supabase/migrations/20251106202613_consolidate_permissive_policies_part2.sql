/*
  # Consolidate Multiple Permissive Policies - Part 2

  1. Changes
    - Continue consolidating multiple permissive policies
    - Combines student and teacher access rules
  
  2. Affected Tables
    - flashcard_reviews (SELECT)
    - flashcards (SELECT)
    - interactive_content (SELECT)
    - mini_quizzes (SELECT)
  
  3. Security
    - No security changes, same authorization logic maintained
*/

-- FLASHCARD_REVIEWS: Consolidate SELECT policies
DROP POLICY IF EXISTS "Students can manage own reviews" ON flashcard_reviews;
DROP POLICY IF EXISTS "Tutors can view student reviews" ON flashcard_reviews;

CREATE POLICY "Users can view flashcard reviews"
  ON flashcard_reviews
  FOR SELECT
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = flashcard_reviews.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Students can manage own reviews"
  ON flashcard_reviews
  FOR ALL
  TO authenticated
  USING (student_id = (select auth.uid()))
  WITH CHECK (student_id = (select auth.uid()));

-- FLASHCARDS: Consolidate SELECT policies
DROP POLICY IF EXISTS "Students can view assigned flashcards" ON flashcards;
DROP POLICY IF EXISTS "Teachers can manage own flashcards" ON flashcards;

CREATE POLICY "Users can view flashcards"
  ON flashcards
  FOR SELECT
  TO authenticated
  USING (
    teacher_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM spaced_repetition_schedule
      WHERE spaced_repetition_schedule.flashcard_id = flashcards.id
      AND spaced_repetition_schedule.student_id = (select auth.uid())
    )
  );

CREATE POLICY "Teachers can manage own flashcards"
  ON flashcards
  FOR ALL
  TO authenticated
  USING (teacher_id = (select auth.uid()))
  WITH CHECK (teacher_id = (select auth.uid()));

-- INTERACTIVE_CONTENT: Consolidate SELECT policies
DROP POLICY IF EXISTS "Students can view assigned interactive content" ON interactive_content;
DROP POLICY IF EXISTS "Teachers can manage own interactive content" ON interactive_content;

CREATE POLICY "Users can view interactive content"
  ON interactive_content
  FOR SELECT
  TO authenticated
  USING (
    teacher_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM content_library
      WHERE content_library.interactive_content_id = interactive_content.id
      AND EXISTS (
        SELECT 1 FROM content_assignments
        WHERE content_assignments.content_id = content_library.id
        AND content_assignments.student_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Teachers can manage own interactive content"
  ON interactive_content
  FOR ALL
  TO authenticated
  USING (teacher_id = (select auth.uid()))
  WITH CHECK (teacher_id = (select auth.uid()));

-- MINI_QUIZZES: Consolidate SELECT policies
DROP POLICY IF EXISTS "Students can manage own quizzes" ON mini_quizzes;
DROP POLICY IF EXISTS "Tutors can view student quizzes" ON mini_quizzes;

CREATE POLICY "Users can view mini quizzes"
  ON mini_quizzes
  FOR SELECT
  TO authenticated
  USING (
    student_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = mini_quizzes.student_id
      AND students.tutor_id = (select auth.uid())
    )
  );

CREATE POLICY "Students can manage own quizzes"
  ON mini_quizzes
  FOR ALL
  TO authenticated
  USING (student_id = (select auth.uid()))
  WITH CHECK (student_id = (select auth.uid()));
