-- Add parent role and parent_id relationship
-- Date: 2026-01-14

-- 1. Update users table role constraint if necessary
-- Note: Some Supabase versions don't allow altering ENUMs easily, 
-- but here 'role' seems to be a TEXT with a CHECK constraint.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('tutor', 'student', 'parent', 'admin'));

-- 2. Add parent_id to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Create a policy for parents to view their own students
DROP POLICY IF EXISTS "Parents can view their own students" ON public.students;
CREATE POLICY "Parents can view their own students"
    ON public.students FOR SELECT
    TO authenticated
    USING (
        auth.uid() = parent_id OR 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'parent' AND students.parent_id = users.id
        )
    );

-- 4. Create a policy for parents to create students
-- Note: In the current system, students are created by signing up via Auth API
-- and then inserting into students table. To allow this, we need an INSERT policy.
DROP POLICY IF EXISTS "Parents can insert students" ON public.students;
CREATE POLICY "Parents can insert students"
    ON public.students FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'parent'
        )
    );

-- 5. Create a policy for parents to manage (update/delete) their students
DROP POLICY IF EXISTS "Parents can update their own students" ON public.students;
CREATE POLICY "Parents can update their own students"
    ON public.students FOR UPDATE
    TO authenticated
    USING (parent_id = auth.uid())
    WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can delete their own students" ON public.students;
CREATE POLICY "Parents can delete their own students"
    ON public.students FOR DELETE
    TO authenticated
    USING (parent_id = auth.uid());

-- 6. Update users table policies to allow parents to see student user records
DROP POLICY IF EXISTS "Parents can view student user data" ON public.users;
CREATE POLICY "Parents can view student user data"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        id IN (SELECT id FROM public.students WHERE parent_id = auth.uid())
    );

-- 7. Migrate existing parents to users table ONLY if they have an auth record
INSERT INTO public.users (id, email, name, role, created_at)
SELECT p.id, p.email, p.name, 'parent', p.created_at
FROM public.parents p
WHERE EXISTS (SELECT 1 FROM auth.users au WHERE au.id = p.id)
ON CONFLICT (id) DO UPDATE 
SET role = 'parent', 
    name = EXCLUDED.name;

-- 8. Migrate existing relations to the parent_id column in students
-- Only migrate if the parent has an auth record (otherwise FK constraint on students.parent_id would fail)
UPDATE public.students
SET parent_id = psr.parent_id
FROM public.parent_student_relations psr
WHERE students.id = psr.student_id
AND students.parent_id IS NULL
AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = psr.parent_id);

-- 9. Add index for performance
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON public.students(parent_id);
