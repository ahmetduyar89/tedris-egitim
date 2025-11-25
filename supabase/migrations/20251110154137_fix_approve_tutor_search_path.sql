/*
  # Fix approve_tutor Function Search Path Security

  1. Security Improvement
    - Fixes the approve_tutor(uuid) function that's missing secure search_path
    - There are two overloaded versions of approve_tutor function
    - One has secure search_path, the other doesn't

  2. Function Updated
    - `approve_tutor(tutor_id uuid)`: Sets search_path to public, pg_temp

  3. Security Notes
    - search_path = 'public, pg_temp' prevents search_path injection attacks
    - Essential for SECURITY DEFINER functions
    - The other overload approve_tutor(uuid, uuid) already has secure search_path

  4. Implementation
    - Drop and recreate the single-parameter version with secure search_path
    - Maintain exact same business logic
*/

-- Drop the function without secure search_path
DROP FUNCTION IF EXISTS public.approve_tutor(uuid);

-- Recreate with secure search_path
CREATE FUNCTION public.approve_tutor(tutor_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result json;
BEGIN
  -- Sadece adminler bu fonksiyonu çağırabilir
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND is_admin = true 
    AND status = 'approved'
  ) THEN
    RETURN json_build_object('error', 'Unauthorized: Only admins can approve tutors');
  END IF;

  -- Öğretmeni onayla
  UPDATE users
  SET 
    status = 'approved',
    approved_at = now(),
    approved_by = auth.uid()
  WHERE id = tutor_id AND role = 'tutor';

  IF FOUND THEN
    result := json_build_object('success', true, 'message', 'Tutor approved successfully');
  ELSE
    result := json_build_object('error', 'Tutor not found');
  END IF;

  RETURN result;
END;
$$;
