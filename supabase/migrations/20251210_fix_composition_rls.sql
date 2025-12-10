-- Fix for Composition Assignment "Not Found" Error
-- This migration adds a policy to allow students to view compositions assigned to them

-- Add policy for students to view assigned compositions
CREATE POLICY IF NOT EXISTS "Students can view assigned compositions"
  ON compositions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM composition_assignments
      WHERE composition_assignments.composition_id = compositions.id
      AND composition_assignments.student_id = auth.uid()
    )
  );
