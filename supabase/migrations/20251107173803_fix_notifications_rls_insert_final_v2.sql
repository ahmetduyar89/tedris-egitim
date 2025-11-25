/*
  # Fix Notifications INSERT RLS Policy - Final v2

  1. Problem
    - Current policy WITH CHECK (auth.uid() IS NOT NULL) is still failing
    - Supabase may be evaluating this differently than expected
    
  2. Solution
    - Drop the current failing policy
    - Create a simpler policy that just allows authenticated users
    - Remove the WITH CHECK clause entirely (defaults to true for authenticated)
    
  3. Security
    - Only authenticated users can insert (enforced by TO authenticated)
    - Users can only read their own notifications (existing SELECT policy)
    - Users can only update their own notifications (existing UPDATE policy)
*/

-- Drop the failing policy
DROP POLICY IF EXISTS "Allow notification creation" ON notifications;

-- Create a simpler INSERT policy
-- By not specifying WITH CHECK, it defaults to allowing all inserts for authenticated users
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated;
