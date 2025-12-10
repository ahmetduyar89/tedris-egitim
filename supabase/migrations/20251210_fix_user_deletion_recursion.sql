-- Create a secure function to check admin status
-- SECURITY DEFINER allows this function to bypass RLS policies and avoid infinite recursion
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$;

-- Drop problematic policies related to deletion on users table
-- Dropping by name is safer, but names might vary. Let's try to drop known ones.
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can delete users v2" ON users;
DROP POLICY IF EXISTS "Admin delete users" ON users;

-- Create a new safe delete policy using the secure function
-- This allows admins to delete any user
CREATE POLICY "Admins can delete users"
ON users
FOR DELETE
TO authenticated
USING (
  check_is_admin()
);

-- Note: We generally don't want users efficiently deleting themselves directly from the client without cleanup,
-- but if needed, another policy could be added. For now, focusing on the Admin deletion error.

-- Also ensure admins can SELECT users to see who to delete, without recursion
DROP POLICY IF EXISTS "Admins can view all users" ON users;

CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  check_is_admin() OR auth.uid() = id
);

-- Fix UPDATE recursion as well, since admins need to approve/reject users
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can update users v2" ON users;

CREATE POLICY "Admins can update users"
ON users
FOR UPDATE
TO authenticated
USING (
  check_is_admin()
)
WITH CHECK (
  check_is_admin()
);
