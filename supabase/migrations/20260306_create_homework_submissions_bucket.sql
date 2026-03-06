-- Create the storage bucket for homework submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homework-submissions',
  'homework-submissions',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can upload homework files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read homework files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read homework files" ON storage.objects;

-- Allow students to upload homework files to their own folder
CREATE POLICY "Students can upload homework files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'homework-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users (student, tutor, parent) to read homework files
CREATE POLICY "Users can read homework files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'homework-submissions');

-- Allow public access to read homework files (needed for embedding)
CREATE POLICY "Public can read homework files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'homework-submissions');

-- Allow students to delete their own uploads
CREATE POLICY "Students can delete their homework files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'homework-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
