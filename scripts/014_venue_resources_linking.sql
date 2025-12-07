-- Migration 014: Venue Resource Linking System
-- Enables venues to link to collections and assets for curated resources

-- ============================================================================
-- VENUE RESOURCE JUNCTION TABLES
-- ============================================================================

-- Link venues to collections (many-to-many)
CREATE TABLE IF NOT EXISTS venue_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  context TEXT DEFAULT 'general',  -- general, meetings, weddings, spa, etc.
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  notes TEXT,  -- Internal notes about why this collection is recommended
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(venue_id, collection_id, context)
);

-- Link venues to assets (many-to-many)
CREATE TABLE IF NOT EXISTS venue_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  context TEXT DEFAULT 'general',  -- general, meetings, weddings, spa, etc.
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  notes TEXT,  -- Internal notes about why this asset is recommended
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(venue_id, asset_id, context)
);

-- Link visit stops to collections (many-to-many) for tour-specific resources
CREATE TABLE IF NOT EXISTS visit_stop_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_stop_id UUID NOT NULL REFERENCES visit_stops(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  notes TEXT,  -- Why this collection is relevant for this specific tour stop
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(visit_stop_id, collection_id)
);

-- Link visit stops to assets (many-to-many) for tour-specific resources
CREATE TABLE IF NOT EXISTS visit_stop_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_stop_id UUID NOT NULL REFERENCES visit_stops(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  notes TEXT,  -- Why this asset is relevant for this specific tour stop
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(visit_stop_id, asset_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Venue resource lookups
CREATE INDEX IF NOT EXISTS idx_venue_collections_venue_id ON venue_collections(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_collections_collection_id ON venue_collections(collection_id);
CREATE INDEX IF NOT EXISTS idx_venue_collections_context ON venue_collections(context);
CREATE INDEX IF NOT EXISTS idx_venue_collections_featured ON venue_collections(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_venue_assets_venue_id ON venue_assets(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_assets_asset_id ON venue_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_venue_assets_context ON venue_assets(context);
CREATE INDEX IF NOT EXISTS idx_venue_assets_featured ON venue_assets(is_featured) WHERE is_featured = true;

-- Visit stop resource lookups
CREATE INDEX IF NOT EXISTS idx_visit_stop_collections_stop_id ON visit_stop_collections(visit_stop_id);
CREATE INDEX IF NOT EXISTS idx_visit_stop_collections_collection_id ON visit_stop_collections(collection_id);

CREATE INDEX IF NOT EXISTS idx_visit_stop_assets_stop_id ON visit_stop_assets(visit_stop_id);
CREATE INDEX IF NOT EXISTS idx_visit_stop_assets_asset_id ON visit_stop_assets(asset_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all junction tables
ALTER TABLE venue_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_stop_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_stop_assets ENABLE ROW LEVEL SECURITY;

-- Venue Collections Policies
CREATE POLICY "venue_collections_select" ON venue_collections
  FOR SELECT USING (true);  -- Public read for client tours

CREATE POLICY "venue_collections_insert" ON venue_collections
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "venue_collections_update" ON venue_collections
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "venue_collections_delete" ON venue_collections
  FOR DELETE USING (auth.role() = 'authenticated');

-- Venue Assets Policies
CREATE POLICY "venue_assets_select" ON venue_assets
  FOR SELECT USING (true);  -- Public read for client tours

CREATE POLICY "venue_assets_insert" ON venue_assets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "venue_assets_update" ON venue_assets
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "venue_assets_delete" ON venue_assets
  FOR DELETE USING (auth.role() = 'authenticated');

-- Visit Stop Collections Policies
CREATE POLICY "visit_stop_collections_select" ON visit_stop_collections
  FOR SELECT USING (true);  -- Public read via share token

CREATE POLICY "visit_stop_collections_insert" ON visit_stop_collections
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "visit_stop_collections_update" ON visit_stop_collections
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "visit_stop_collections_delete" ON visit_stop_collections
  FOR DELETE USING (auth.role() = 'authenticated');

-- Visit Stop Assets Policies
CREATE POLICY "visit_stop_assets_select" ON visit_stop_assets
  FOR SELECT USING (true);  -- Public read via share token

CREATE POLICY "visit_stop_assets_insert" ON visit_stop_assets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "visit_stop_assets_update" ON visit_stop_assets
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "visit_stop_assets_delete" ON visit_stop_assets
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get all resources for a venue (collections + assets)
CREATE OR REPLACE FUNCTION get_venue_resources(p_venue_id UUID, p_context TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'collections', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', c.id,
        'name', c.name,
        'description', c.description,
        'cover_image_url', c.cover_image_url,
        'asset_count', COALESCE(array_length(c.asset_ids, 1), 0),
        'display_order', vc.display_order,
        'is_featured', vc.is_featured,
        'context', vc.context
      ) ORDER BY vc.display_order, c.name), '[]'::json)
      FROM venue_collections vc
      JOIN collections c ON c.id = vc.collection_id
      WHERE vc.venue_id = p_venue_id
        AND (p_context IS NULL OR vc.context = p_context)
        AND c.is_active = true
    ),
    'assets', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', a.id,
        'name', a.name,
        'asset_type', a.asset_type,
        'category', a.category,
        'language', a.language,
        'thumbnail_url', a.thumbnail_url,
        'display_order', va.display_order,
        'is_featured', va.is_featured,
        'context', va.context
      ) ORDER BY va.display_order, a.name), '[]'::json)
      FROM venue_assets va
      JOIN assets a ON a.id = va.asset_id
      WHERE va.venue_id = p_venue_id
        AND (p_context IS NULL OR va.context = p_context)
        AND a.is_active = true
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to get all resources for a visit stop
CREATE OR REPLACE FUNCTION get_visit_stop_resources(p_visit_stop_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'collections', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', c.id,
        'name', c.name,
        'description', c.description,
        'cover_image_url', c.cover_image_url,
        'asset_count', COALESCE(array_length(c.asset_ids, 1), 0),
        'display_order', vsc.display_order
      ) ORDER BY vsc.display_order, c.name), '[]'::json)
      FROM visit_stop_collections vsc
      JOIN collections c ON c.id = vsc.collection_id
      WHERE vsc.visit_stop_id = p_visit_stop_id
        AND c.is_active = true
    ),
    'assets', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', a.id,
        'name', a.name,
        'asset_type', a.asset_type,
        'category', a.category,
        'language', a.language,
        'thumbnail_url', a.thumbnail_url,
        'display_order', vsa.display_order
      ) ORDER BY vsa.display_order, a.name), '[]'::json)
      FROM visit_stop_assets vsa
      JOIN assets a ON a.id = vsa.asset_id
      WHERE vsa.visit_stop_id = p_visit_stop_id
        AND a.is_active = true
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE venue_collections IS 'Junction table linking venues to recommended collections';
COMMENT ON TABLE venue_assets IS 'Junction table linking venues to recommended assets';
COMMENT ON TABLE visit_stop_collections IS 'Junction table linking tour stops to collections shown during that stop';
COMMENT ON TABLE visit_stop_assets IS 'Junction table linking tour stops to assets shown during that stop';

COMMENT ON FUNCTION get_venue_resources IS 'Get all collections and assets linked to a venue, optionally filtered by context';
COMMENT ON FUNCTION get_visit_stop_resources IS 'Get all collections and assets linked to a visit stop';
