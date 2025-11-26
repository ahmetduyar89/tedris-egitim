-- Performance Optimization Indexes

-- 1. Tests Table Indexes
-- For querying student's completed tests ordered by submission date (Dashboard & Reports)
CREATE INDEX IF NOT EXISTS idx_tests_student_completed 
ON tests(student_id, completed, submission_date DESC);

-- For querying tests by subject (Filtering)
CREATE INDEX IF NOT EXISTS idx_tests_subject 
ON tests(subject);

-- GIN index for querying within JSONB questions column (Search & Analysis)
CREATE INDEX IF NOT EXISTS idx_tests_questions_gin 
ON tests USING GIN (questions);

-- 2. Assignments Table Indexes
-- For querying student's pending assignments (Dashboard)
CREATE INDEX IF NOT EXISTS idx_assignments_student_due 
ON assignments(student_id, due_date DESC);

-- Partial index for active assignments only (Faster lookup for pending tasks)
CREATE INDEX IF NOT EXISTS idx_active_assignments 
ON assignments(student_id, due_date) 
WHERE status != 'Completed';

-- 3. Student Mastery Indexes
-- For Knowledge Graph lookups
CREATE INDEX IF NOT EXISTS idx_student_mastery_lookup 
ON student_mastery(student_id, module_id, mastery_score DESC);

-- 4. Content Library Indexes
-- For searching content by subject and grade
CREATE INDEX IF NOT EXISTS idx_content_subject_grade 
ON content_library(subject, grade);

-- For full text search on content title (if using pg_trgm extension, otherwise standard btree)
CREATE INDEX IF NOT EXISTS idx_content_title 
ON content_library(title);

-- 5. Notifications Indexes
-- For fetching unread notifications quickly
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(recipient_id, read) 
WHERE read = false;
