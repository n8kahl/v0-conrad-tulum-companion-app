-- Quick fix: Add RLS policies for media_library if they're missing
-- This is a subset of migration 007 - run this if you're getting RLS violations

-- Ensure RLS is enabled
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Media library public read for ready media" ON media_library;
DROP POLICY IF EXISTS "Media library authenticated users can insert" ON media_library;
DROP POLICY IF EXISTS "Media library authenticated users can update own" ON media_library;
DROP POLICY IF EXISTS "Media library authenticated users can delete own" ON media_library;

-- Public can read ready media
CREATE POLICY "Media library public read for ready media"
  ON media_library FOR SELECT
  TO public
  USING (status::text = 'ready'::text);

-- Authenticated users can insert
CREATE POLICY "Media library authenticated users can insert"
  ON media_library FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update their own uploads (or orphaned ones)
CREATE POLICY "Media library authenticated users can update own"
  ON media_library FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid() OR uploaded_by IS NULL);

-- Authenticated users can delete their own uploads (or orphaned ones)
CREATE POLICY "Media library authenticated users can delete own"
  ON media_library FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR uploaded_by IS NULL);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'media_library'
ORDER BY policyname;
