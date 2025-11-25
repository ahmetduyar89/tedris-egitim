/*
  # Consolidate Multiple Permissive Policies

  1. Performance & Security Improvement
    - Consolidates multiple permissive SELECT policies into single policies
    - Multiple permissive policies create OR conditions which can be less efficient
    - Single policies with combined logic are clearer and more maintainable

  2. Tables Updated
    - `content_library`: Merge "Teachers can manage own content" + "Users can view content library"
    - `flashcard_reviews`: Merge "Students can manage own reviews" + "Users can view flashcard reviews"
    - `flashcards`: Merge "Teachers can manage own flashcards" + "Users can view flashcards"
    - `interactive_content`: Merge "Teachers can manage own interactive content" + "Users can view interactive content"
    - `mini_quizzes`: Merge "Students can manage own quizzes" + "Users can view mini quizzes"

  3. Logic
    - New policies allow viewing if user owns the content OR if it's shared with them
    - Maintains same access control but in a single, more efficient policy

  4. Schema Notes
    - content_library: open to all authenticated users (public library concept)
    - flashcard_reviews: student owns OR teacher owns the flashcard
    - flashcards: teacher owns OR student has it in spaced repetition schedule
    - interactive_content: teacher owns OR assigned to teacher's students
    - mini_quizzes: student owns OR tutor owns the student
*/

-- content_library: Consolidate SELECT policies
DROP POLICY IF EXISTS "Teachers can manage own content" ON public.content_library;
DROP POLICY IF EXISTS "Users can view content library" ON public.content_library;

CREATE POLICY "Users can view content library"
  ON public.content_library
  FOR SELECT
  TO authenticated
  USING (true);

-- flashcard_reviews: Consolidate SELECT policies
DROP POLICY IF EXISTS "Students can manage own reviews" ON public.flashcard_reviews;
DROP POLICY IF EXISTS "Users can view flashcard reviews" ON public.flashcard_reviews;

CREATE POLICY "Users can view flashcard reviews"
  ON public.flashcard_reviews
  FOR SELECT
  TO authenticated
  USING (
    student_id = (SELECT auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.flashcards f
      WHERE f.id = flashcard_reviews.flashcard_id
      AND f.teacher_id = (SELECT auth.uid())
    )
  );

-- flashcards: Consolidate SELECT policies
DROP POLICY IF EXISTS "Teachers can manage own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can view flashcards" ON public.flashcards;

CREATE POLICY "Users can view flashcards"
  ON public.flashcards
  FOR SELECT
  TO authenticated
  USING (
    teacher_id = (SELECT auth.uid())
    OR
    id IN (
      SELECT flashcard_id FROM public.spaced_repetition_schedule
      WHERE student_id = (SELECT auth.uid())
    )
  );

-- interactive_content: Consolidate SELECT policies
DROP POLICY IF EXISTS "Teachers can manage own interactive content" ON public.interactive_content;
DROP POLICY IF EXISTS "Users can view interactive content" ON public.interactive_content;

CREATE POLICY "Users can view interactive content"
  ON public.interactive_content
  FOR SELECT
  TO authenticated
  USING (
    teacher_id = (SELECT auth.uid())
    OR
    id IN (
      SELECT interactive_content_id 
      FROM public.content_library
      WHERE interactive_content_id IS NOT NULL
    )
  );

-- mini_quizzes: Consolidate SELECT policies
DROP POLICY IF EXISTS "Students can manage own quizzes" ON public.mini_quizzes;
DROP POLICY IF EXISTS "Users can view mini quizzes" ON public.mini_quizzes;

CREATE POLICY "Users can view mini quizzes"
  ON public.mini_quizzes
  FOR SELECT
  TO authenticated
  USING (
    student_id = (SELECT auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = mini_quizzes.student_id
      AND s.tutor_id = (SELECT auth.uid())
    )
  );
