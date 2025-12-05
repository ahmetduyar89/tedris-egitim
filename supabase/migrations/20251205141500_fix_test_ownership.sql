-- Migration: Fix test ownership for deletion
-- Description: Assigns missing teacher_id to tests based on the student's tutor.
-- This allows tutors to delete tests they created but failed to tag with teacher_id.

-- 1. Update tests that have no teacher_id, setting it to the student's tutor_id
UPDATE tests
SET teacher_id = students.tutor_id
FROM students
WHERE tests.student_id = students.id
  AND tests.teacher_id IS NULL;

-- 2. Ensure RLS policies on 'tests' table allow tutors to delete rows they own
-- (This assumes the policy is "teacher_id = auth.uid()", perfectly matching the fix above)

-- NOTE: If there are tests created by OTHER tutors (unlikely in this model), this might reassign them.
-- But given the 1-to-many Tutor-Student relationship, the student's tutor is the de-facto owner.
