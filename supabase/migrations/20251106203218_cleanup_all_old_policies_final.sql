/*
  # Cleanup Duplicate and Old Policies

  1. Changes
    - Remove old duplicate policies that were not properly cleaned up
    - Ensure only consolidated policies remain
  
  2. Affected Tables
    - students: Remove old UPDATE policies
  
  3. Security
    - No security changes, removing duplicates only
*/

-- Remove old duplicate UPDATE policies on students table
DROP POLICY IF EXISTS "Students can update own data" ON students;
DROP POLICY IF EXISTS "Tutors can update assigned students" ON students;
