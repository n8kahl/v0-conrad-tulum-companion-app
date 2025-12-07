-- Create and configure the media-library storage bucket
-- This is required for file uploads to work

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-library',
  'media-library',
  true, -- Public bucket for media files
  104857600, -- 100MB file size limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own files" ON storage.objects;

-- Create storage policies for the media-library bucket
-- 1. Anyone can read files (public bucket)
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media-library');

-- 2. Authenticated users can upload files
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media-library');

-- 3. Authenticated users can update their own files
CREATE POLICY "Authenticated users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media-library' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'media-library' AND auth.uid() = owner);

-- 4. Authenticated users can delete their own files
CREATE POLICY "Authenticated users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media-library' AND auth.uid() = owner);

-- Verify bucket exists
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'media-library';

-- Verify storage policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%media%'
ORDER BY cmd, policyname;
