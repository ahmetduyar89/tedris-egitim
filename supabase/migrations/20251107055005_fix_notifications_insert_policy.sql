/*
  # Fix Notifications Insert Policy

  1. Changes
    - Drop existing restrictive insert policy
    - Create a permissive insert policy that allows authenticated users to send notifications to any user
  
  2. Security
    - Authenticated users (teachers) can send notifications to students
    - Users can only read their own notifications (existing SELECT policy)
*/

-- Drop existing policy
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Authenticated users can insert notifications'
  ) THEN
    DROP POLICY "Authenticated users can insert notifications" ON notifications;
  END IF;
END $$;

-- Create new permissive policy for inserting notifications
CREATE POLICY "Authenticated users can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
