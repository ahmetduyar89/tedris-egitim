/*
  # Add student read access to interactive content

  1. Changes
    - Add SELECT policy for students to view interactive content that is assigned to them
    - Students can only view interactive content that has been assigned via content_assignments

  2. Security
    - Students can only read interactive content linked to content_library items assigned to them
    - No direct access to all interactive content
    - Maintains teacher ownership while enabling student viewing
*/

-- Add policy for students to read assigned interactive content
CREATE POLICY "Students can view assigned interactive content"
  ON interactive_content
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM content_library cl
      JOIN content_assignments ca ON ca.content_id = cl.id
      WHERE cl.interactive_content_id = interactive_content.id
        AND ca.student_id = auth.uid()
    )
  );
