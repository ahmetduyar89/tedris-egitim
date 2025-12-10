-- RLS Fixes (Keep these to ensure regular security is tight)
-- Create a secure function to check admin status
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

-- Drop problematic policies
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can delete users v2" ON users;
DROP POLICY IF EXISTS "Admin delete users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can update users v2" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create safe policies using the secure function
CREATE POLICY "Admins can delete users" ON users FOR DELETE TO authenticated USING (check_is_admin());
CREATE POLICY "Admins can update users" ON users FOR UPDATE TO authenticated USING (check_is_admin()) WITH CHECK (check_is_admin());
CREATE POLICY "Admins can view all users" ON users FOR SELECT TO authenticated USING (check_is_admin() OR auth.uid() = id);


-- RPC Functions for Admin Actions (Bypassing RLS completely for critical actions)

-- 1. Delete User RPC
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only admins can delete users.';
  END IF;
  
  DELETE FROM users WHERE id = target_user_id;
END;
$$;

-- 2. Update User Status RPC (Approve/Reject)
CREATE OR REPLACE FUNCTION admin_update_user_status(target_user_id UUID, new_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only admins can update user status.';
  END IF;
  
  UPDATE users SET status = new_status WHERE id = target_user_id;
END;
$$;

-- 3. Update User Details RPC
CREATE OR REPLACE FUNCTION admin_update_user_details(target_user_id UUID, new_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT check_is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only admins can update user details.';
  END IF;
  
  UPDATE users SET name = new_name WHERE id = target_user_id;
END;
$$;
