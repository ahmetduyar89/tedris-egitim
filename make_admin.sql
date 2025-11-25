-- Script to promote a user to Admin
-- Run this in the Supabase Dashboard SQL Editor AFTER signing up the user

-- Set the email of the user you want to make admin
-- CHANGE THIS EMAIL to the one you signed up with
DO $$
DECLARE
    target_email TEXT := 'admin@teoritech.com';
BEGIN
    -- 1. Remove the restrictive check constraint on role
    BEGIN
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Constraint users_role_check might not exist or could not be dropped: %', SQLERRM;
    END;

    -- 2. Add a new check constraint that includes 'admin'
    BEGIN
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('tutor', 'student', 'admin'));
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Constraint users_role_check already exists';
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not add new constraint: %', SQLERRM;
    END;

    -- 3. Update the user's role and other admin fields
    -- We set status to 'approved' because admin functions check for this
    -- We set is_admin to true because admin functions check for this
    UPDATE users
    SET 
        role = 'admin',
        status = 'approved',
        is_admin = true
    WHERE email = target_email;
    
    -- 4. Update auth.users metadata as well for consistency
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        '"admin"'
    )
    WHERE email = target_email;
    
    RAISE NOTICE 'User % promoted to admin successfully with full privileges', target_email;
END $$;
