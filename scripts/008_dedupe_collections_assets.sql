-- Migration 008: Dedupe collections/assets and enforce uniqueness

-- Remove duplicate collections (keep oldest per property/name)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY property_id, name ORDER BY created_at, id) AS rn
  FROM collections
)
DELETE FROM collections
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Remove duplicate assets (keep oldest per property/name)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY property_id, name ORDER BY created_at, id) AS rn
  FROM assets
)
DELETE FROM assets
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Clean asset_ids arrays: drop missing/duplicate asset references while preserving first occurrence order
UPDATE collections
SET asset_ids = (
  SELECT COALESCE(array_agg(val ORDER BY ord), '{}')
  FROM (
    SELECT DISTINCT ON (val) val, ord
    FROM unnest(asset_ids) WITH ORDINALITY AS t(val, ord)
    JOIN assets a ON a.id = val
    ORDER BY val, ord
  ) s
)
WHERE asset_ids IS NOT NULL;

-- Enforce uniqueness going forward
CREATE UNIQUE INDEX IF NOT EXISTS collections_property_name_key
  ON collections (property_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS assets_property_name_key
  ON assets (property_id, name);
