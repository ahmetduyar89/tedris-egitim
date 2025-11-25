/*
  # Remove Newly Identified Unused Indexes

  1. Performance Improvement
    - Removes indexes that are not being used by queries
    - Reduces storage overhead and improves write performance
    - Indexes can be recreated if usage patterns change

  2. Indexes Removed
    - `idx_assignments_teacher_id` on assignments
    - `idx_flashcard_reviews_flashcard_id` on flashcard_reviews
    - `idx_flashcard_reviews_schedule_id` on flashcard_reviews
    - `idx_interactive_content_teacher_id` on interactive_content
    - `idx_users_approved_by` on users

  3. Notes
    - These were recently added but haven't been utilized yet
    - May become useful as application usage grows
    - Monitor query performance and recreate if needed
*/

-- Drop unused indexes
DROP INDEX IF EXISTS public.idx_assignments_teacher_id;
DROP INDEX IF EXISTS public.idx_flashcard_reviews_flashcard_id;
DROP INDEX IF EXISTS public.idx_flashcard_reviews_schedule_id;
DROP INDEX IF EXISTS public.idx_interactive_content_teacher_id;
DROP INDEX IF EXISTS public.idx_users_approved_by;
