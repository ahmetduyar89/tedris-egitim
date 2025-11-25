/*
  # Fix Function Search Path Security

  1. Security Improvement
    - Sets secure search_path for database functions to prevent search_path attacks
    - Protects against malicious schema injection attacks
    - Applies to: make_first_user_admin, approve_tutor, reject_tutor

  2. Functions Updated
    - `make_first_user_admin`: Sets search_path to public, pg_temp
    - `approve_tutor`: Sets search_path to public, pg_temp
    - `reject_tutor`: Sets search_path to public, pg_temp

  3. Security Notes
    - search_path = 'public, pg_temp' ensures functions only look in trusted schemas
    - Prevents attackers from creating malicious objects in user schemas
    - Best practice for SECURITY DEFINER functions

  4. Implementation
    - Drop triggers first, then functions
    - Recreate with exact same logic but secure search_path
    - Reattach triggers
*/

-- Drop triggers first
DROP TRIGGER IF EXISTS make_first_user_admin_trigger ON public.users;
DROP TRIGGER IF EXISTS trigger_make_first_user_admin ON public.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.make_first_user_admin() CASCADE;
DROP FUNCTION IF EXISTS public.approve_tutor(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.reject_tutor(uuid) CASCADE;

-- Recreate make_first_user_admin with secure search_path
CREATE FUNCTION public.make_first_user_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE is_admin = true) THEN
    NEW.is_admin := true;
    NEW.role := 'admin';
    NEW.status := 'approved';
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate approve_tutor with secure search_path
CREATE FUNCTION public.approve_tutor(tutor_user_id uuid, admin_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.users
  SET status = 'approved',
      approved_at = now(),
      approved_by = admin_user_id
  WHERE id = tutor_user_id;
END;
$$;

-- Recreate reject_tutor with secure search_path
CREATE FUNCTION public.reject_tutor(tutor_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.users WHERE id = tutor_user_id;
END;
$$;

-- Reattach trigger for make_first_user_admin
CREATE TRIGGER trigger_make_first_user_admin
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.make_first_user_admin();
