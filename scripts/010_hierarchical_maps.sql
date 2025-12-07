-- Migration: Add hierarchical map system to venues
-- This enables multi-level maps (property → building → floor → space)
-- and visual pin placement for venue locations

-- Add map-related columns to venues table
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS map_image_url TEXT,
ADD COLUMN IF NOT EXISTS map_image_media_id UUID REFERENCES media_library(id),
ADD COLUMN IF NOT EXISTS parent_venue_id UUID REFERENCES venues(id),
ADD COLUMN IF NOT EXISTS venue_type TEXT DEFAULT 'space';

-- Create index for parent-child queries
CREATE INDEX IF NOT EXISTS idx_venues_parent_venue_id ON venues(parent_venue_id);
CREATE INDEX IF NOT EXISTS idx_venues_venue_type ON venues(venue_type);

-- Add check constraint for venue_type
ALTER TABLE venues DROP CONSTRAINT IF EXISTS venues_venue_type_check;
ALTER TABLE venues ADD CONSTRAINT venues_venue_type_check 
  CHECK (venue_type IN ('property', 'building', 'floor', 'space', 'outdoor'));

-- Update location JSONB structure to include map coordinates
-- Existing: { lat, lng, building, floor }
-- New: { lat, lng, building, floor, mapX, mapY }
-- mapX and mapY are percentage positions (0-100) on parent map image

COMMENT ON COLUMN venues.map_image_url IS 'Map image showing this venue and its child locations';
COMMENT ON COLUMN venues.map_image_media_id IS 'Reference to media_library for map image';
COMMENT ON COLUMN venues.parent_venue_id IS 'Parent venue in hierarchy (building contains floors, floor contains spaces)';
COMMENT ON COLUMN venues.venue_type IS 'Hierarchy level: property (root), building, floor, space (leaf), outdoor';

-- Example hierarchy:
-- Conrad Tulum (property)
--   ├─ Main Building (building)
--   │  ├─ Ground Floor (floor)
--   │  │  ├─ Grand Ballroom (space)
--   │  │  ├─ Terrace (space)
--   │  │  └─ Lobby Bar (space)
--   │  └─ Second Floor (floor)
--   │     ├─ Boardroom A (space)
--   │     └─ Boardroom B (space)
--   └─ Beach Area (outdoor)
--      ├─ Beach Pavilion (space)
--      └─ Oceanfront Lawn (space)

-- Create function to get venue path (breadcrumb)
CREATE OR REPLACE FUNCTION get_venue_path(venue_id UUID)
RETURNS TABLE(id UUID, name TEXT, venue_type TEXT, level INT) AS $$
  WITH RECURSIVE venue_path AS (
    -- Base case: start with the given venue
    SELECT 
      v.id,
      v.name,
      v.venue_type,
      v.parent_venue_id,
      0 AS level
    FROM venues v
    WHERE v.id = venue_id
    
    UNION ALL
    
    -- Recursive case: get parent venues
    SELECT 
      v.id,
      v.name,
      v.venue_type,
      v.parent_venue_id,
      vp.level + 1
    FROM venues v
    INNER JOIN venue_path vp ON v.id = vp.parent_venue_id
  )
  SELECT id, name, venue_type, level
  FROM venue_path
  ORDER BY level DESC;
$$ LANGUAGE sql STABLE;

-- Create function to get child venues
CREATE OR REPLACE FUNCTION get_child_venues(venue_id UUID)
RETURNS TABLE(id UUID, name TEXT, venue_type TEXT, location JSONB, map_image_url TEXT) AS $$
  SELECT 
    id,
    name,
    venue_type,
    location,
    map_image_url
  FROM venues
  WHERE parent_venue_id = venue_id
  ORDER BY sort_order, name;
$$ LANGUAGE sql STABLE;

-- Migrate existing resort map from branding to property venue
-- This will be run manually after migration to preserve data
-- Example:
-- INSERT INTO venues (property_id, name, venue_type, map_image_url, is_active)
-- SELECT id, name || ' - Resort Map', 'property', 
--   branding_config->'images'->>'resortMap',
--   true
-- FROM properties
-- WHERE branding_config->'images'->>'resortMap' IS NOT NULL;

-- Update existing venues to be children of property venue (run after creating property venue)
-- UPDATE venues
-- SET parent_venue_id = (SELECT id FROM venues WHERE venue_type = 'property' LIMIT 1)
-- WHERE parent_venue_id IS NULL AND venue_type != 'property';
