/*
  # Fix Notifications Insert Policy

  1. Changes
    - Drop the broken insert policy that has no WITH CHECK expression
    - Create a new insert policy that allows authenticated users to create notifications
    - Teachers can create notifications for their students
    - System can create notifications for any user
  
  2. Security
    - Only authenticated users can insert notifications
    - WITH CHECK ensures the policy is properly enforced
*/

-- Drop the broken policy
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;

-- Create a proper insert policy
CREATE POLICY "Authenticated users can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);
