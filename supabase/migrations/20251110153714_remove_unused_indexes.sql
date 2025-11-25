/*
  # Remove Unused Indexes

  1. Performance Improvement
    - Removes indexes that are not being used by queries
    - Reduces storage overhead and improves write performance
    - Indexes removed were identified by Supabase analytics as unused

  2. Indexes Removed
    - `idx_content_library_interactive_content_id` on content_library
    - `idx_users_status` on users
    - `idx_users_is_admin` on users
    - `idx_qb_assignments_question_bank_id` on question_bank_assignments
    - `idx_flashcards_teacher_id` on flashcards
    - `idx_spaced_schedule_flashcard_id` on spaced_repetition_schedule
    - `idx_spaced_schedule_next_review` on spaced_repetition_schedule
    - `idx_submissions_student_id` on submissions
    - `idx_weekly_programs_student_id` on weekly_programs
    - `idx_review_packages_student_id` on review_packages
    - `idx_public_content_shares_share_token` on public_content_shares

  3. Notes
    - These indexes are not being utilized by queries
    - Can be recreated if usage patterns change
    - Reducing index count improves INSERT/UPDATE performance
*/

-- Drop unused indexes
DROP INDEX IF EXISTS public.idx_content_library_interactive_content_id;
DROP INDEX IF EXISTS public.idx_users_status;
DROP INDEX IF EXISTS public.idx_users_is_admin;
DROP INDEX IF EXISTS public.idx_qb_assignments_question_bank_id;
DROP INDEX IF EXISTS public.idx_flashcards_teacher_id;
DROP INDEX IF EXISTS public.idx_spaced_schedule_flashcard_id;
DROP INDEX IF EXISTS public.idx_spaced_schedule_next_review;
DROP INDEX IF EXISTS public.idx_submissions_student_id;
DROP INDEX IF EXISTS public.idx_weekly_programs_student_id;
DROP INDEX IF EXISTS public.idx_review_packages_student_id;
DROP INDEX IF EXISTS public.idx_public_content_shares_share_token;
