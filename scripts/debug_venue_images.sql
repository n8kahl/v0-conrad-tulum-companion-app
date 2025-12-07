-- Diagnostic query to check venue media setup
-- Run this in Supabase SQL Editor to see what's happening with venue images

-- 1. Check if venues have media linked
SELECT 
  v.id as venue_id,
  v.name as venue_name,
  COUNT(vm.id) as media_count,
  STRING_AGG(vm.context, ', ') as contexts
FROM venues v
LEFT JOIN venue_media vm ON vm.venue_id = v.id
GROUP BY v.id, v.name
ORDER BY media_count DESC, v.name;

-- 2. Check venue_media records with full media details
SELECT 
  v.name as venue_name,
  vm.context,
  vm.is_primary,
  vm.sort_order,
  ml.id as media_id,
  ml.file_name,
  ml.storage_path,
  ml.thumbnail_path,
  ml.status,
  ml.mime_type
FROM venue_media vm
JOIN venues v ON v.id = vm.venue_id
LEFT JOIN media_library ml ON ml.id = vm.media_id
ORDER BY v.name, vm.context, vm.sort_order;

-- 3. Check for orphaned venue_media (media_id doesn't exist)
SELECT 
  vm.id,
  v.name as venue_name,
  vm.media_id,
  vm.context
FROM venue_media vm
JOIN venues v ON v.id = vm.venue_id
LEFT JOIN media_library ml ON ml.id = vm.media_id
WHERE ml.id IS NULL;

-- 4. Check media library files that are ready
SELECT 
  id,
  file_name,
  storage_path,
  thumbnail_path,
  status,
  mime_type,
  created_at
FROM media_library
WHERE status = 'ready'
  AND mime_type LIKE 'image/%'
ORDER BY created_at DESC
LIMIT 20;
