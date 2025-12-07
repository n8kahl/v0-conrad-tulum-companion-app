-- Migration 007: Media Library System
-- Complete redesign of media management from manual URLs to centralized media hub
-- with upload, processing, extraction, and intelligent linking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- ENUMS - Drop and recreate to ensure clean state
-- ================================================================

-- Drop existing tables first to break dependencies
DROP TABLE IF EXISTS media_collection_items CASCADE;
DROP TABLE IF EXISTS media_collections CASCADE;
DROP TABLE IF EXISTS pdf_extractions CASCADE;
DROP TABLE IF EXISTS asset_media CASCADE;
DROP TABLE IF EXISTS venue_media CASCADE;
DROP TABLE IF EXISTS media_library CASCADE;

-- Now drop types
DROP TYPE IF EXISTS media_file_type CASCADE;
DROP TYPE IF EXISTS media_status CASCADE;
DROP TYPE IF EXISTS venue_media_context CASCADE;

-- Recreate types
CREATE TYPE media_file_type AS ENUM (
  'image', 'video', 'pdf', 'document', 'audio', 'floorplan', '360_tour'
);

CREATE TYPE media_status AS ENUM (
  'uploading', 'processing', 'ready', 'failed'
);

CREATE TYPE venue_media_context AS ENUM (
  'hero',           -- Primary showcase image
  'gallery',        -- General gallery
  'floorplan',      -- Floor plan diagrams
  'capacity_chart', -- Seating capacity visuals
  'setup_theater',  -- Theater setup example
  'setup_banquet',  -- Banquet setup example
  'setup_classroom',-- Classroom setup example
  'setup_reception',-- Reception setup example
  'menu',           -- F&B menus for venue
  'av_diagram',     -- AV equipment layout
  '360_tour',       -- Virtual tour
  'video_walkthrough', -- Video content
  'previous_event'  -- Past event photos (anonymized)
);

-- ================================================================
-- TABLE: media_library
-- Central repository for ALL uploaded files
-- ================================================================
CREATE TABLE media_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- File info
  original_filename TEXT NOT NULL,
  file_type media_file_type NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  
  -- Storage paths (Supabase Storage)
  storage_path TEXT NOT NULL,           -- Original file
  thumbnail_path TEXT,                   -- Generated thumbnail
  preview_path TEXT,                     -- Larger preview or first page
  blurhash TEXT,                         -- Instant preview placeholder
  
  -- Processing status
  status media_status DEFAULT 'uploading',
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_error TEXT,
  
  -- Extracted metadata (varies by file type)
  metadata JSONB DEFAULT '{}',
  -- Images: {width, height, exif: {...}, dominant_colors: [...]}
  -- PDFs: {page_count, extracted_text, tables: [...], document_type}
  -- Videos: {duration_seconds, width, height, codec}
  -- Audio: {duration_seconds, transcript, sentiment}
  
  -- AI-generated tags for search/filtering
  ai_tags TEXT[] DEFAULT '{}',
  
  -- Manual metadata
  title TEXT,
  description TEXT,
  alt_text TEXT,
  custom_tags TEXT[] DEFAULT '{}',
  
  -- Searchable content (for full-text search)
  searchable_text TEXT,
  
  -- Source tracking
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'upload' CHECK (source IN ('upload', 'camera', 'voice_note', 'import', 'migration')),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_library_property ON media_library(property_id);
CREATE INDEX IF NOT EXISTS idx_media_library_type ON media_library(file_type);
CREATE INDEX IF NOT EXISTS idx_media_library_status ON media_library(status);
CREATE INDEX IF NOT EXISTS idx_media_library_tags ON media_library USING GIN(ai_tags);
CREATE INDEX IF NOT EXISTS idx_media_library_custom_tags ON media_library USING GIN(custom_tags);
CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON media_library(uploaded_by);

-- ================================================================
-- TABLE: venue_media
-- Links media to venues with context
-- ================================================================
CREATE TABLE venue_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  
  -- Context and ordering
  context venue_media_context NOT NULL DEFAULT 'gallery',
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,  -- Primary image for this context
  
  -- Optional caption specific to this venue usage
  caption TEXT,
  
  -- Visibility
  show_on_tour BOOLEAN DEFAULT true,    -- Show during site tours
  show_on_public BOOLEAN DEFAULT true,  -- Show on public website
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(venue_id, media_id, context)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_venue_media_venue ON venue_media(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_media_media ON venue_media(media_id);
CREATE INDEX IF NOT EXISTS idx_venue_media_context ON venue_media(venue_id, context);
CREATE INDEX IF NOT EXISTS idx_venue_media_display_order ON venue_media(venue_id, context, display_order);

-- Ensure only one primary per venue per context
CREATE UNIQUE INDEX IF NOT EXISTS idx_venue_media_primary_context
  ON venue_media(venue_id, context)
  WHERE is_primary = true;

-- ================================================================
-- TABLE: asset_media
-- Links media to sales assets (versioned)
-- ================================================================
CREATE TABLE asset_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  
  -- Role in the asset
  role TEXT NOT NULL DEFAULT 'primary',  -- 'primary', 'thumbnail', 'page_1', etc.
  language TEXT DEFAULT 'en',
  
  -- Versioning (for updated documents)
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(asset_id, media_id, role, language)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_asset_media_asset ON asset_media(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_media_media ON asset_media(media_id);
CREATE INDEX IF NOT EXISTS idx_asset_media_current ON asset_media(asset_id, is_current);

-- ================================================================
-- TABLE: pdf_extractions
-- Structured data extracted from PDFs
-- ================================================================
CREATE TABLE pdf_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  
  -- Page-level data
  page_number INTEGER NOT NULL,
  page_thumbnail_path TEXT,
  page_text TEXT,
  
  -- Extracted tables (if any)
  tables JSONB DEFAULT '[]',
  -- [{name: "Capacity Chart", headers: [...], rows: [...]}]
  
  -- Detected content type
  content_type TEXT,  -- 'text', 'table', 'image', 'diagram', 'floorplan'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(media_id, page_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pdf_extractions_media ON pdf_extractions(media_id);
CREATE INDEX IF NOT EXISTS idx_pdf_extractions_content_type ON pdf_extractions(content_type);

-- ================================================================
-- TABLE: media_collections
-- Group media for easy access (optional feature)
-- ================================================================
CREATE TABLE media_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  cover_media_id UUID REFERENCES media_library(id) ON DELETE SET NULL,
  
  -- Auto-generated or manual
  is_smart_collection BOOLEAN DEFAULT false,
  smart_filter JSONB,  -- {file_type: 'image', tags: ['ballroom']}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE media_collection_items (
  collection_id UUID NOT NULL REFERENCES media_collections(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (collection_id, media_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_collections_property ON media_collections(property_id);
CREATE INDEX IF NOT EXISTS idx_media_collection_items_collection ON media_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_media_collection_items_media ON media_collection_items(media_id);

-- ================================================================
-- UPDATE: visit_captures table (enhance existing)
-- ================================================================
-- If visit_captures doesn't exist, create it; otherwise alter
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'visit_captures') THEN
    CREATE TABLE visit_captures (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      visit_stop_id UUID NOT NULL REFERENCES visit_stops(id) ON DELETE CASCADE,
      media_id UUID REFERENCES media_library(id) ON DELETE CASCADE,
      
      -- Capture details
      capture_type TEXT NOT NULL CHECK (capture_type IN ('photo', 'voice_note', 'video_clip', 'annotation')),
      captured_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- For voice notes
      transcript TEXT,
      transcript_summary TEXT,
      sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'excited', 'concerned', NULL)),
      
      -- For annotations
      annotation_text TEXT,
      annotation_emoji TEXT,
      
      -- Location within venue
      location_hint TEXT,
      
      -- Flags
      is_client_visible BOOLEAN DEFAULT true,
      is_highlighted BOOLEAN DEFAULT false,
      include_in_recap BOOLEAN DEFAULT true,
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_visit_captures_stop ON visit_captures(visit_stop_id);
    CREATE INDEX idx_visit_captures_type ON visit_captures(capture_type);
    CREATE INDEX idx_visit_captures_media ON visit_captures(media_id);
  ELSE
    -- Add media_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'visit_captures' AND column_name = 'media_id') THEN
      ALTER TABLE visit_captures ADD COLUMN media_id UUID REFERENCES media_library(id) ON DELETE CASCADE;
      CREATE INDEX idx_visit_captures_media ON visit_captures(media_id);
    END IF;
  END IF;
END $$;

-- ================================================================
-- RLS POLICIES
-- ================================================================

-- media_library: Public read for ready media, authenticated write
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Media library public read for ready media" ON media_library;
CREATE POLICY "Media library public read for ready media"
  ON media_library FOR SELECT
  TO public
  USING (status::text = 'ready'::text);

DROP POLICY IF EXISTS "Media library authenticated users can insert" ON media_library;
CREATE POLICY "Media library authenticated users can insert"
  ON media_library FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Media library authenticated users can update own" ON media_library;
CREATE POLICY "Media library authenticated users can update own"
  ON media_library FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid() OR uploaded_by IS NULL);

DROP POLICY IF EXISTS "Media library authenticated users can delete own" ON media_library;
CREATE POLICY "Media library authenticated users can delete own"
  ON media_library FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR uploaded_by IS NULL);

-- venue_media: Public read, authenticated write
ALTER TABLE venue_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Venue media public read" ON venue_media;
CREATE POLICY "Venue media public read"
  ON venue_media FOR SELECT
  TO public
  USING (show_on_public = true);

DROP POLICY IF EXISTS "Venue media authenticated write" ON venue_media;
CREATE POLICY "Venue media authenticated write"
  ON venue_media FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- asset_media: Public read, authenticated write
ALTER TABLE asset_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Asset media public read" ON asset_media;
CREATE POLICY "Asset media public read"
  ON asset_media FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Asset media authenticated write" ON asset_media;
CREATE POLICY "Asset media authenticated write"
  ON asset_media FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- pdf_extractions: Public read, authenticated write
ALTER TABLE pdf_extractions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PDF extractions public read" ON pdf_extractions;
CREATE POLICY "PDF extractions public read"
  ON pdf_extractions FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "PDF extractions authenticated write" ON pdf_extractions;
CREATE POLICY "PDF extractions authenticated write"
  ON pdf_extractions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- media_collections: Public read, authenticated write
ALTER TABLE media_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_collection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Media collections public read" ON media_collections;
CREATE POLICY "Media collections public read"
  ON media_collections FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Media collections authenticated write" ON media_collections;
CREATE POLICY "Media collections authenticated write"
  ON media_collections FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Media collection items public read" ON media_collection_items;
CREATE POLICY "Media collection items public read"
  ON media_collection_items FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Media collection items authenticated write" ON media_collection_items;
CREATE POLICY "Media collection items authenticated write"
  ON media_collection_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- MIGRATION: Existing URL-based data to media_library
-- ================================================================

DO $$
DECLARE
  prop_id UUID;
BEGIN
  -- Get Conrad Tulum property ID
  SELECT id INTO prop_id FROM properties WHERE slug = 'conrad-tulum' LIMIT 1;
  
  IF prop_id IS NULL THEN
    RAISE NOTICE 'Property not found, skipping data migration';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Starting migration of existing media URLs to media_library...';
  
  -- =====================================================
  -- STEP 1: Migrate venue images
  -- =====================================================
  INSERT INTO media_library (
    property_id,
    original_filename,
    file_type,
    mime_type,
    file_size_bytes,
    storage_path,
    status,
    source,
    title
  )
  SELECT DISTINCT
    v.property_id,
    SPLIT_PART(SPLIT_PART(url, '/', -1), '?', 1) as original_filename,
    'image'::media_file_type as file_type,
    'image/jpeg' as mime_type,
    0 as file_size_bytes,
    url as storage_path,
    'ready'::media_status as status,
    'migration' as source,
    v.name || ' - Image ' || row_number() OVER (PARTITION BY v.id ORDER BY ordinality) as title
  FROM venues v,
  LATERAL unnest(v.images) WITH ORDINALITY AS t(url, ordinality)
  WHERE array_length(v.images, 1) > 0
  ON CONFLICT DO NOTHING;
  
  -- Link migrated images to venues
  INSERT INTO venue_media (venue_id, media_id, context, display_order, is_primary, show_on_tour, show_on_public)
  SELECT 
    v.id as venue_id,
    m.id as media_id,
    CASE WHEN t.ordinality = 1 THEN 'hero'::venue_media_context ELSE 'gallery'::venue_media_context END as context,
    t.ordinality as display_order,
    t.ordinality = 1 as is_primary,
    true as show_on_tour,
    true as show_on_public
  FROM venues v
  CROSS JOIN LATERAL unnest(v.images) WITH ORDINALITY AS t(url, ordinality)
  INNER JOIN media_library m ON m.storage_path = t.url AND m.property_id = v.property_id
  WHERE array_length(v.images, 1) > 0
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Migrated venue images';
  
  -- =====================================================
  -- STEP 2: Migrate venue floorplans
  -- =====================================================
  INSERT INTO media_library (
    property_id,
    original_filename,
    file_type,
    mime_type,
    file_size_bytes,
    storage_path,
    status,
    source,
    title
  )
  SELECT DISTINCT
    property_id,
    SPLIT_PART(SPLIT_PART(floorplan_url, '/', -1), '?', 1),
    CASE 
      WHEN floorplan_url LIKE '%.pdf' THEN 'pdf'::media_file_type
      ELSE 'floorplan'::media_file_type
    END,
    CASE 
      WHEN floorplan_url LIKE '%.pdf' THEN 'application/pdf'
      ELSE 'image/png'
    END,
    0,
    floorplan_url,
    'ready'::media_status,
    'migration',
    name || ' - Floor Plan'
  FROM venues
  WHERE floorplan_url IS NOT NULL AND floorplan_url != ''
  ON CONFLICT DO NOTHING;
  
  -- Link floorplans to venues
  INSERT INTO venue_media (venue_id, media_id, context, is_primary, show_on_tour, show_on_public)
  SELECT 
    v.id,
    m.id,
    'floorplan'::venue_media_context,
    true,
    true,
    true
  FROM venues v
  JOIN media_library m ON m.storage_path = v.floorplan_url AND m.property_id = v.property_id
  WHERE v.floorplan_url IS NOT NULL AND v.floorplan_url != ''
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Migrated venue floorplans';
  
  -- =====================================================
  -- STEP 3: Migrate asset URLs
  -- =====================================================
  -- Assets have JSONB urls field with keys like {pdf: "url", video: "url", flipbook_en: "url"}
  INSERT INTO media_library (
    property_id,
    original_filename,
    file_type,
    mime_type,
    file_size_bytes,
    storage_path,
    status,
    source,
    title
  )
  SELECT DISTINCT
    a.property_id,
    SPLIT_PART(SPLIT_PART(t.url_value, '/', -1), '?', 1),
    CASE 
      WHEN t.url_key = 'pdf' THEN 'pdf'::media_file_type
      WHEN t.url_key LIKE 'flipbook%' THEN 'pdf'::media_file_type
      WHEN t.url_key = 'video' THEN 'video'::media_file_type
      WHEN t.url_key = 'virtual_tour' THEN '360_tour'::media_file_type
      ELSE 'document'::media_file_type
    END,
    CASE 
      WHEN t.url_key = 'pdf' OR t.url_key LIKE 'flipbook%' THEN 'application/pdf'
      WHEN t.url_key = 'video' THEN 'video/mp4'
      ELSE 'application/octet-stream'
    END,
    0,
    t.url_value,
    'ready'::media_status,
    'migration',
    a.name || ' - ' || UPPER(t.url_key)
  FROM assets a
  CROSS JOIN LATERAL jsonb_each_text(a.urls) AS t(url_key, url_value)
  WHERE t.url_value IS NOT NULL AND t.url_value != ''
  ON CONFLICT DO NOTHING;
  
  -- Link migrated assets to assets table
  INSERT INTO asset_media (asset_id, media_id, role, language, is_current)
  SELECT 
    a.id,
    m.id,
    t.url_key,
    CASE 
      WHEN t.url_key LIKE '%_en' THEN 'en'
      WHEN t.url_key LIKE '%_es' THEN 'es'
      ELSE 'en'
    END,
    true
  FROM assets a
  CROSS JOIN LATERAL jsonb_each_text(a.urls) AS t(url_key, url_value)
  INNER JOIN media_library m ON m.storage_path = t.url_value AND m.property_id = a.property_id
  WHERE t.url_value IS NOT NULL AND t.url_value != ''
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Migrated asset media';
  
  -- =====================================================
  -- STEP 4: Migrate asset thumbnails
  -- =====================================================
  INSERT INTO media_library (
    property_id,
    original_filename,
    file_type,
    mime_type,
    file_size_bytes,
    storage_path,
    status,
    source,
    title
  )
  SELECT DISTINCT
    property_id,
    SPLIT_PART(SPLIT_PART(thumbnail_url, '/', -1), '?', 1),
    'image'::media_file_type,
    'image/jpeg',
    0,
    thumbnail_url,
    'ready'::media_status,
    'migration',
    name || ' - Thumbnail'
  FROM assets
  WHERE thumbnail_url IS NOT NULL AND thumbnail_url != ''
  ON CONFLICT DO NOTHING;
  
  -- Link thumbnails to assets
  INSERT INTO asset_media (asset_id, media_id, role, is_current)
  SELECT 
    a.id,
    m.id,
    'thumbnail',
    true
  FROM assets a
  JOIN media_library m ON m.storage_path = a.thumbnail_url AND m.property_id = a.property_id
  WHERE a.thumbnail_url IS NOT NULL AND a.thumbnail_url != ''
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Migrated asset thumbnails';
  RAISE NOTICE 'Migration complete!';
  
END $$;

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Function to get all media for a venue grouped by context
CREATE OR REPLACE FUNCTION get_venue_media_by_context(p_venue_id UUID)
RETURNS TABLE (
  context venue_media_context,
  media JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vm.context,
    jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'title', m.title,
        'file_type', m.file_type,
        'storage_path', m.storage_path,
        'thumbnail_path', m.thumbnail_path,
        'preview_path', m.preview_path,
        'blurhash', m.blurhash,
        'caption', vm.caption,
        'display_order', vm.display_order,
        'is_primary', vm.is_primary
      ) ORDER BY vm.display_order, vm.created_at
    ) as media
  FROM venue_media vm
  JOIN media_library m ON m.id = vm.media_id
  WHERE vm.venue_id = p_venue_id AND m.status = 'ready'
  GROUP BY vm.context;
END;
$$ LANGUAGE plpgsql;

-- Function to search media library
CREATE OR REPLACE FUNCTION search_media_library(
  p_property_id UUID,
  p_query TEXT DEFAULT NULL,
  p_file_types media_file_type[] DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  file_type media_file_type,
  thumbnail_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.title,
    m.file_type,
    m.thumbnail_path,
    m.created_at
  FROM media_library m
  WHERE m.property_id = p_property_id
    AND m.status = 'ready'
    AND (p_query IS NULL OR to_tsvector('english', 
          COALESCE(m.title, '') || ' ' || 
          COALESCE(m.description, '') || ' ' || 
          COALESCE(m.searchable_text, '')
        ) @@ plainto_tsquery('english', p_query))
    AND (p_file_types IS NULL OR m.file_type = ANY(p_file_types))
    AND (p_tags IS NULL OR m.ai_tags && p_tags OR m.custom_tags && p_tags)
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
