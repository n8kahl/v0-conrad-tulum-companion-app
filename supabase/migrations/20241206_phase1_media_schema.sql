-- Phase 1: Mobile-First Tour Experience - Database Schema
-- Migration: 20241206_phase1_media_schema.sql

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: media_library
-- Centralized storage for all media files
-- ============================================
CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document')),
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  file_size INTEGER,
  dimensions JSONB DEFAULT '{}', -- {width, height} for images/video
  duration INTEGER, -- for audio/video in seconds
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'upload' CHECK (source IN ('upload', 'capture', 'ai_generated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for property lookups
CREATE INDEX IF NOT EXISTS idx_media_library_property ON media_library(property_id);

-- Index for file type filtering
CREATE INDEX IF NOT EXISTS idx_media_library_file_type ON media_library(file_type);

-- Index for tag searches
CREATE INDEX IF NOT EXISTS idx_media_library_tags ON media_library USING GIN(tags);

-- ============================================
-- TABLE: venue_media
-- Junction table linking venues to media
-- ============================================
CREATE TABLE IF NOT EXISTS venue_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media_library(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  context TEXT DEFAULT 'gallery' CHECK (context IN ('hero', 'gallery', 'floorplan', 'menu', 'capacity_chart')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(venue_id, media_id)
);

-- Index for venue lookups
CREATE INDEX IF NOT EXISTS idx_venue_media_venue ON venue_media(venue_id);

-- Ensure only one primary per venue
CREATE UNIQUE INDEX IF NOT EXISTS idx_venue_media_primary
  ON venue_media(venue_id)
  WHERE is_primary = true;

-- ============================================
-- TABLE: visit_captures
-- Photos and voice notes captured during tours
-- ============================================
CREATE TABLE IF NOT EXISTS visit_captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_stop_id UUID REFERENCES visit_stops(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media_library(id) ON DELETE CASCADE,
  capture_type TEXT NOT NULL CHECK (capture_type IN ('photo', 'voice_note', 'video')),
  caption TEXT,
  transcript TEXT, -- for voice notes (AI transcribed)
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', NULL)),
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  captured_by TEXT DEFAULT 'sales' CHECK (captured_by IN ('sales', 'client')),
  location JSONB, -- {lat, lng} GPS coordinates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for visit stop lookups
CREATE INDEX IF NOT EXISTS idx_visit_captures_stop ON visit_captures(visit_stop_id);

-- Index for capture type filtering
CREATE INDEX IF NOT EXISTS idx_visit_captures_type ON visit_captures(capture_type);

-- ============================================
-- TABLE: visit_annotations
-- Rich feedback (reactions, questions, concerns)
-- ============================================
CREATE TABLE IF NOT EXISTS visit_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_stop_id UUID REFERENCES visit_stops(id) ON DELETE CASCADE,
  annotation_type TEXT NOT NULL CHECK (annotation_type IN ('reaction', 'question', 'concern', 'highlight', 'note')),
  content TEXT,
  emoji TEXT,
  priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 3),
  created_by TEXT DEFAULT 'sales' CHECK (created_by IN ('sales', 'client')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for visit stop lookups
CREATE INDEX IF NOT EXISTS idx_visit_annotations_stop ON visit_annotations(visit_stop_id);

-- Index for annotation type filtering
CREATE INDEX IF NOT EXISTS idx_visit_annotations_type ON visit_annotations(annotation_type);

-- ============================================
-- TABLE: recap_drafts
-- AI-generated recap storage with versioning
-- ============================================
CREATE TABLE IF NOT EXISTS recap_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_visit_id UUID REFERENCES site_visits(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  ai_summary TEXT,
  key_highlights JSONB DEFAULT '[]',
  recommended_next_steps JSONB DEFAULT '[]',
  proposal_talking_points JSONB DEFAULT '[]',
  concerns JSONB DEFAULT '[]',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for site visit lookups
CREATE INDEX IF NOT EXISTS idx_recap_drafts_visit ON recap_drafts(site_visit_id);

-- ============================================
-- ALTER: visit_stops enhancements
-- Add new columns for engagement tracking
-- ============================================
ALTER TABLE visit_stops
  ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative', NULL)),
  ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recap_drafts ENABLE ROW LEVEL SECURITY;

-- media_library policies
CREATE POLICY "Public read access for active media"
  ON media_library FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert media"
  ON media_library FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update own media"
  ON media_library FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid() OR uploaded_by IS NULL);

CREATE POLICY "Authenticated users can delete own media"
  ON media_library FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR uploaded_by IS NULL);

-- venue_media policies
CREATE POLICY "Public read access for venue media"
  ON venue_media FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage venue media"
  ON venue_media FOR ALL
  TO authenticated
  USING (true);

-- visit_captures policies
CREATE POLICY "Read captures for visit participants"
  ON visit_captures FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert captures"
  ON visit_captures FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anonymous capture inserts for tour mode"
  ON visit_captures FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update captures"
  ON visit_captures FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete captures"
  ON visit_captures FOR DELETE
  TO authenticated
  USING (true);

-- visit_annotations policies
CREATE POLICY "Read annotations for visit participants"
  ON visit_annotations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert annotations"
  ON visit_annotations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update annotations"
  ON visit_annotations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete annotations"
  ON visit_annotations FOR DELETE
  TO authenticated
  USING (true);

-- recap_drafts policies
CREATE POLICY "Read recaps for authenticated users"
  ON recap_drafts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage recaps"
  ON recap_drafts FOR ALL
  TO authenticated
  USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for media_library updated_at
DROP TRIGGER IF EXISTS update_media_library_updated_at ON media_library;
CREATE TRIGGER update_media_library_updated_at
  BEFORE UPDATE ON media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(stop_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  capture_count INTEGER;
  annotation_count INTEGER;
  is_favorited BOOLEAN;
  has_notes BOOLEAN;
BEGIN
  -- Get capture count (photos and voice notes)
  SELECT COUNT(*) INTO capture_count
  FROM visit_captures
  WHERE visit_stop_id = stop_id;

  -- Get annotation count
  SELECT COUNT(*) INTO annotation_count
  FROM visit_annotations
  WHERE visit_stop_id = stop_id;

  -- Check if favorited
  SELECT client_favorited INTO is_favorited
  FROM visit_stops
  WHERE id = stop_id;

  -- Check if has notes
  SELECT (client_reaction IS NOT NULL AND client_reaction != '') INTO has_notes
  FROM visit_stops
  WHERE id = stop_id;

  -- Calculate score
  score := capture_count * 10 + annotation_count * 5;
  IF is_favorited THEN score := score + 20; END IF;
  IF has_notes THEN score := score + 15; END IF;

  RETURN LEAST(score, 100); -- Cap at 100
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Note: Run this in Supabase Dashboard > Storage
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('media-library', 'media-library', true);

COMMENT ON TABLE media_library IS 'Centralized storage for all media files including photos, videos, audio, and documents';
COMMENT ON TABLE venue_media IS 'Junction table linking venues to their associated media files';
COMMENT ON TABLE visit_captures IS 'Photos and voice notes captured during site tour visits';
COMMENT ON TABLE visit_annotations IS 'Rich feedback including reactions, questions, and concerns during visits';
COMMENT ON TABLE recap_drafts IS 'AI-generated visit recap drafts with version control';
