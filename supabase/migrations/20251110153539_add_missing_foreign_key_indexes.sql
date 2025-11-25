/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvement
    - Add indexes for unindexed foreign keys to improve join performance
    - Covers: assignments.teacher_id, flashcard_reviews.flashcard_id, 
      flashcard_reviews.schedule_id, interactive_content.teacher_id, users.approved_by

  2. Indexes Added
    - `idx_assignments_teacher_id` on assignments(teacher_id)
    - `idx_flashcard_reviews_flashcard_id` on flashcard_reviews(flashcard_id)
    - `idx_flashcard_reviews_schedule_id` on flashcard_reviews(schedule_id)
    - `idx_interactive_content_teacher_id` on interactive_content(teacher_id)
    - `idx_users_approved_by` on users(approved_by)

  3. Notes
    - These indexes will significantly improve query performance for foreign key joins
    - Particularly important for queries that filter or join on these columns
*/

-- Add index for assignments.teacher_id
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id 
ON public.assignments(teacher_id);

-- Add index for flashcard_reviews.flashcard_id
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_flashcard_id 
ON public.flashcard_reviews(flashcard_id);

-- Add index for flashcard_reviews.schedule_id
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_schedule_id 
ON public.flashcard_reviews(schedule_id);

-- Add index for interactive_content.teacher_id
CREATE INDEX IF NOT EXISTS idx_interactive_content_teacher_id 
ON public.interactive_content(teacher_id);

-- Add index for users.approved_by
CREATE INDEX IF NOT EXISTS idx_users_approved_by 
ON public.users(approved_by);
