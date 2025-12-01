-- Fix RLS policies for student creation flow
-- The frontend uses a temporary client authenticated as the new student to insert the profile.
-- So we need policies that allow a user to insert their OWN record into users and students tables.

-- 1. Policies for 'users' table
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
  );

-- 2. Policies for 'students' table
DROP POLICY IF EXISTS "Users can insert own student profile" ON students;
CREATE POLICY "Users can insert own student profile"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
  );

-- 3. Ensure Tutors can still view/update their students (existing policies might cover this, but reinforcing)
DROP POLICY IF EXISTS "Tutors can view their students" ON students;
CREATE POLICY "Tutors can view their students"
  ON students FOR SELECT
  TO authenticated
  USING (
    tutor_id = auth.uid()
  );

-- Also allow tutors to insert students directly if they use their own client (though frontend uses tempClient)
DROP POLICY IF EXISTS "Tutors can insert students" ON students;
CREATE POLICY "Tutors can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    tutor_id = auth.uid()
  );
