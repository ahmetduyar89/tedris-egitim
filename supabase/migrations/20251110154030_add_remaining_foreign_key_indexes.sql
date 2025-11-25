/*
  # Add Remaining Foreign Key Indexes

  1. Performance Improvement
    - Add indexes for remaining unindexed foreign keys
    - Improves join and filter performance on foreign key columns

  2. Indexes Added
    - `idx_flashcards_teacher_id` on flashcards(teacher_id)
    - `idx_qb_assignments_question_bank_id` on question_bank_assignments(question_bank_id)
    - `idx_review_packages_student_id` on review_packages(student_id)
    - `idx_spaced_schedule_flashcard_id` on spaced_repetition_schedule(flashcard_id)
    - `idx_submissions_student_id` on submissions(student_id)
    - `idx_weekly_programs_student_id` on weekly_programs(student_id)

  3. Notes
    - These indexes significantly improve query performance for foreign key joins
    - Essential for scalability as data grows
*/

-- Add index for flashcards.teacher_id
CREATE INDEX IF NOT EXISTS idx_flashcards_teacher_id 
ON public.flashcards(teacher_id);

-- Add index for question_bank_assignments.question_bank_id
CREATE INDEX IF NOT EXISTS idx_qb_assignments_question_bank_id 
ON public.question_bank_assignments(question_bank_id);

-- Add index for review_packages.student_id
CREATE INDEX IF NOT EXISTS idx_review_packages_student_id 
ON public.review_packages(student_id);

-- Add index for spaced_repetition_schedule.flashcard_id
CREATE INDEX IF NOT EXISTS idx_spaced_schedule_flashcard_id 
ON public.spaced_repetition_schedule(flashcard_id);

-- Add index for submissions.student_id
CREATE INDEX IF NOT EXISTS idx_submissions_student_id 
ON public.submissions(student_id);

-- Add index for weekly_programs.student_id
CREATE INDEX IF NOT EXISTS idx_weekly_programs_student_id 
ON public.weekly_programs(student_id);
