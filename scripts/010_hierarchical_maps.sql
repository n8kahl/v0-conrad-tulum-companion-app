-- Migration: Add hierarchical map system to venues
-- This enables multi-level maps (property → building → floor → space)
-- and visual pin placement for venue locations

-- First, add new values to existing venue_type ENUM
-- Note: venue_type is already an ENUM from migration 001 with values:
-- 'meeting_room', 'outdoor', 'restaurant', 'spa', 'pool', 'lobby', 'ballroom', 'beach'
-- We're adding: 'property', 'building', 'floor', 'space' for hierarchy

ALTER TYPE venue_type ADD VALUE IF NOT EXISTS 'property';
ALTER TYPE venue_type ADD VALUE IF NOT EXISTS 'building';
ALTER TYPE venue_type ADD VALUE IF NOT EXISTS 'floor';
ALTER TYPE venue_type ADD VALUE IF NOT EXISTS 'space';

-- Add map-related columns to venues table
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS map_image_url TEXT,
ADD COLUMN IF NOT EXISTS map_image_media_id UUID REFERENCES media_library(id),
ADD COLUMN IF NOT EXISTS parent_venue_id UUID REFERENCES venues(id);

-- Create index for parent-child queries
CREATE INDEX IF NOT EXISTS idx_venues_parent_venue_id ON venues(parent_venue_id);
CREATE INDEX IF NOT EXISTS idx_venues_venue_type ON venues(venue_type);

-- Update location JSONB structure to include map coordinates
-- Existing: { lat, lng, building, floor }
-- New: { lat, lng, building, floor, mapX, mapY }
-- mapX and mapY are percentage positions (0-100) on parent map image

COMMENT ON COLUMN venues.map_image_url IS 'Map image showing this venue and its child locations';
COMMENT ON COLUMN venues.map_image_media_id IS 'Reference to media_library for map image';
COMMENT ON COLUMN venues.parent_venue_id IS 'Parent venue in hierarchy (building contains floors, floor contains spaces)';

-- venue_type ENUM now includes both hierarchy levels AND specific venue types:
-- Hierarchy: 'property' (root), 'building', 'floor', 'space' (generic)
-- Specific: 'meeting_room', 'ballroom', 'restaurant', 'spa', 'pool', 'lobby', 'beach', 'outdoor'
-- Use hierarchy types for structure, specific types for actual bookable/tourable venues

-- Example hierarchy:
-- Conrad Tulum (property)
--   ├─ Main Building (building)
--   │  ├─ Ground Floor (floor)
--   │  │  ├─ Grand Ballroom (ballroom) ← Use specific type
--   │  │  ├─ Lobby Bar (lobby)
--   │  │  └─ Coral Restaurant (restaurant)
--   │  └─ Second Floor (floor)
--   │     ├─ Boardroom A (meeting_room) ← Use specific type
--   │     └─ Boardroom B (meeting_room)
--   └─ Beach Area (outdoor) ← Can be both parent AND specific type
--      └─ Beach Pavilion (space)

-- Create function to get venue path (breadcrumb)
CREATE OR REPLACE FUNCTION get_venue_path(venue_id UUID)
RETURNS TABLE(id UUID, name TEXT, venue_type TEXT, level INT) AS $$
  WITH RECURSIVE venue_path AS (
    -- Base case: start with the given venue
    SELECT 
      v.id,
      v.name,
      v.venue_type::TEXT AS venue_type,
      v.parent_venue_id,
      0 AS level
    FROM venues v
    WHERE v.id = venue_id
    
    UNION ALL
    
    -- Recursive case: get parent venues
    SELECT 
      v.id,
      v.name,
      v.venue_type::TEXT AS venue_type,
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
RETURNS TABLE(id UUID, name TEXT, venue_type TEXT, map_coordinates JSONB, map_image_url TEXT) AS $$
  SELECT 
    id,
    name,
    venue_type::TEXT,
    map_coordinates,
    map_image_url
  FROM venues
  WHERE parent_venue_id = venue_id
  ORDER BY name;
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
