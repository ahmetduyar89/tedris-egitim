/*
  # Remove Unused Indexes

  1. Changes
    - Drop indexes that are not being used by queries
    - Reduces database overhead and improves write performance
    - Indexes can be recreated later if query patterns change
  
  2. Removed Indexes
    - assignments: idx_assignments_teacher_id
    - flashcards: idx_flashcards_subject_grade, idx_flashcards_teacher
    - spaced_repetition_schedule: idx_spaced_schedule_next_review, idx_spaced_repetition_schedule_flashcard_id
    - question_banks: idx_question_banks_subject_grade
    - question_bank_assignments: idx_qb_assignments_student, idx_qb_assignments_status, idx_question_bank_assignments_qb_id
    - weekly_programs: idx_weekly_programs_student_id
    - content_assignments: idx_content_assignments_content_id
    - flashcard_reviews: idx_flashcard_reviews_flashcard_id, idx_flashcard_reviews_schedule_id
    - interactive_content: idx_interactive_content_teacher_id
    - review_packages: idx_review_packages_student_id
    - submissions: idx_submissions_student_id
  
  3. Performance Impact
    - Reduces storage overhead
    - Improves INSERT/UPDATE/DELETE performance
    - No impact on current query performance (indexes not used)
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_assignments_teacher_id;
DROP INDEX IF EXISTS idx_flashcards_subject_grade;
DROP INDEX IF EXISTS idx_flashcards_teacher;
DROP INDEX IF EXISTS idx_spaced_schedule_next_review;
DROP INDEX IF EXISTS idx_question_banks_subject_grade;
DROP INDEX IF EXISTS idx_qb_assignments_student;
DROP INDEX IF EXISTS idx_qb_assignments_status;
DROP INDEX IF EXISTS idx_weekly_programs_student_id;
DROP INDEX IF EXISTS idx_content_assignments_content_id;
DROP INDEX IF EXISTS idx_flashcard_reviews_flashcard_id;
DROP INDEX IF EXISTS idx_flashcard_reviews_schedule_id;
DROP INDEX IF EXISTS idx_interactive_content_teacher_id;
DROP INDEX IF EXISTS idx_question_bank_assignments_qb_id;
DROP INDEX IF EXISTS idx_review_packages_student_id;
DROP INDEX IF EXISTS idx_spaced_repetition_schedule_flashcard_id;
DROP INDEX IF EXISTS idx_submissions_student_id;
