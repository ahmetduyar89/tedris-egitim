/*
  # Add Foreign Key Indexes for Performance

  1. Performance Improvements
    - Add indexes on all foreign key columns to improve join performance
    - Covers 14 unindexed foreign keys identified in security audit
    
  2. Indexes Added
    - badges(student_id)
    - chat_messages(student_id)
    - content_assignments(content_id, student_id)
    - flashcard_reviews(flashcard_id, schedule_id)
    - interactive_content(teacher_id)
    - progress_reports(student_id)
    - question_bank_assignments(question_bank_id)
    - review_packages(student_id)
    - spaced_repetition_schedule(flashcard_id)
    - submissions(assignment_id, student_id)
    - weekly_programs(student_id)
    
  3. Benefits
    - Faster JOIN operations
    - Improved query performance for foreign key lookups
    - Better performance for cascading deletes
*/

-- Add index for badges foreign key
CREATE INDEX IF NOT EXISTS idx_badges_student_id ON public.badges(student_id);

-- Add index for chat_messages foreign key
CREATE INDEX IF NOT EXISTS idx_chat_messages_student_id ON public.chat_messages(student_id);

-- Add indexes for content_assignments foreign keys
CREATE INDEX IF NOT EXISTS idx_content_assignments_content_id ON public.content_assignments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_assignments_student_id ON public.content_assignments(student_id);

-- Add indexes for flashcard_reviews foreign keys
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_flashcard_id ON public.flashcard_reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_schedule_id ON public.flashcard_reviews(schedule_id);

-- Add index for interactive_content foreign key
CREATE INDEX IF NOT EXISTS idx_interactive_content_teacher_id ON public.interactive_content(teacher_id);

-- Add index for progress_reports foreign key
CREATE INDEX IF NOT EXISTS idx_progress_reports_student_id ON public.progress_reports(student_id);

-- Add index for question_bank_assignments foreign key
CREATE INDEX IF NOT EXISTS idx_question_bank_assignments_qb_id ON public.question_bank_assignments(question_bank_id);

-- Add index for review_packages foreign key
CREATE INDEX IF NOT EXISTS idx_review_packages_student_id ON public.review_packages(student_id);

-- Add index for spaced_repetition_schedule foreign key
CREATE INDEX IF NOT EXISTS idx_spaced_repetition_schedule_flashcard_id ON public.spaced_repetition_schedule(flashcard_id);

-- Add indexes for submissions foreign keys
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions(student_id);

-- Add index for weekly_programs foreign key
CREATE INDEX IF NOT EXISTS idx_weekly_programs_student_id ON public.weekly_programs(student_id);