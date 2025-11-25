/*
  # Fix Public Content Shares INSERT Policy

  ## Problem
  The INSERT policy for public_content_shares was checking the content ownership
  by referencing public_content_shares.content_id in a subquery, which doesn't work
  during INSERT operations because the row doesn't exist yet.

  ## Solution
  Replace the INSERT policy to properly reference NEW.content_id instead of
  public_content_shares.content_id.

  ## Changes
  1. Drop the existing INSERT policy
  2. Create a corrected INSERT policy that properly validates content ownership
*/

-- Drop the old policy
DROP POLICY IF EXISTS "Tutors can create shares for own content" ON public_content_shares;

-- Create corrected policy with proper content_id reference
CREATE POLICY "Tutors can create shares for own content"
  ON public_content_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM content_library
      WHERE content_library.id = content_id
      AND content_library.teacher_id = auth.uid()
    )
  );
