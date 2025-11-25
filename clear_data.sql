-- Script to clear all default and user-generated data
-- Run this in the Supabase Dashboard SQL Editor

-- Disable triggers temporarily to avoid conflicts (optional, but recommended for bulk deletes)
SET session_replication_role = 'replica';

-- Truncate tables with CASCADE to handle foreign key dependencies
-- Order matters less with CASCADE, but good to be thorough

TRUNCATE TABLE 
    notifications,
    submissions,
    assignments,
    content_assignments,
    content_library,
    interactive_content,
    review_packages,
    weekly_programs,
    tests,
    progress_reports,
    badges,
    students,
    chat_messages,
    -- Add other tables found in types.ts but maybe not in initial schema
    -- (If they don't exist, this might fail, so we'll use IF EXISTS or separate statements if possible, 
    -- but TRUNCATE doesn't support IF EXISTS in all versions easily. 
    -- For safety, we list known tables from schema + types)
    question_bank_assignments,
    student_mastery,
    tedris_plan_tasks,
    mastery_history,
    adaptive_plan_logs,
    diagnosis_test_results,
    flashcards,
    spaced_repetition_schedules,
    flashcard_reviews,
    mini_quizzes,
    -- mini_quiz_questions is likely a child of mini_quizzes
    users
CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Optional: Reset sequences if needed (usually not needed for UUIDs)
