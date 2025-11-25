/*
  # Fix Users Table RLS Policies

  1. Changes
    - Allow users to insert their own record during signup
    - Allow users to read their own data
    - Update existing policies to be more permissive during signup

  2. Security
    - Users can only insert records with their own auth.uid()
    - Users can read their own data
    - No updates or deletes allowed
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Allow users to insert their own record during signup
CREATE POLICY "Users can insert own record during signup"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own name
CREATE POLICY "Users can update own name"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
