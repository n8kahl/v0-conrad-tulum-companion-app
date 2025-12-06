-- Conrad Site Visit Companion Database Schema
-- Migration 001: Create core tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Properties table (multi-hotel scalability)
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  brand_colors JSONB DEFAULT '{"primary": "#C4A052", "secondary": "#2D2D2D", "accent": "#D4AF37"}',
  logo_url TEXT,
  location JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Assets table (all sales materials)
CREATE TYPE asset_type AS ENUM ('pdf', 'flipbook', 'image', 'video', 'virtual_tour', 'diagram');
CREATE TYPE asset_category AS ENUM ('sales', 'weddings', 'spa', 'events', 'marketing');

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type asset_type NOT NULL,
  category asset_category NOT NULL,
  language TEXT DEFAULT 'en',
  urls JSONB DEFAULT '{}',
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Collections table (curated bundles)
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  asset_ids UUID[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Venues table (physical spaces)
CREATE TYPE venue_type AS ENUM ('meeting_room', 'outdoor', 'restaurant', 'spa', 'pool', 'lobby', 'ballroom', 'beach');

CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  venue_type venue_type NOT NULL,
  capacities JSONB DEFAULT '{}',
  dimensions JSONB DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  floorplan_url TEXT,
  map_coordinates JSONB DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Site Visits table
CREATE TYPE group_type AS ENUM ('MICE', 'incentive', 'wedding', 'retreat', 'buyout', 'conference');
CREATE TYPE visit_status AS ENUM ('planning', 'scheduled', 'in_progress', 'completed', 'proposal_sent');

CREATE TABLE IF NOT EXISTS site_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  client_company TEXT NOT NULL,
  client_contact JSONB DEFAULT '{}',
  group_type group_type NOT NULL,
  estimated_attendees INTEGER,
  preferred_dates JSONB DEFAULT '{}',
  visit_date DATE,
  status visit_status DEFAULT 'planning',
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Visit Stops table (tour route)
CREATE TABLE IF NOT EXISTS visit_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_visit_id UUID NOT NULL REFERENCES site_visits(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  scheduled_time TIME,
  sales_notes TEXT,
  client_reaction TEXT,
  client_favorited BOOLEAN DEFAULT false,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. User Profiles table (for sales team)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'sales',
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assets_property ON assets(property_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_collections_property ON collections(property_id);
CREATE INDEX IF NOT EXISTS idx_venues_property ON venues(property_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_property ON site_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_share_token ON site_visits(share_token);
CREATE INDEX IF NOT EXISTS idx_visit_stops_site_visit ON visit_stops(site_visit_id);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Properties (public read, authenticated write)
CREATE POLICY "Anyone can view properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert properties" ON properties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update properties" ON properties FOR UPDATE TO authenticated USING (true);

-- RLS Policies: Assets (public read, authenticated write)
CREATE POLICY "Anyone can view active assets" ON assets FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can manage assets" ON assets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies: Collections (public read, authenticated write)
CREATE POLICY "Anyone can view active collections" ON collections FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can manage collections" ON collections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies: Venues (public read, authenticated write)
CREATE POLICY "Anyone can view active venues" ON venues FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can manage venues" ON venues FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies: Site Visits (authenticated or share_token access)
CREATE POLICY "Users can view their own site visits" ON site_visits FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Users can manage their own site visits" ON site_visits FOR ALL TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "Anyone can view site visits with share token" ON site_visits FOR SELECT USING (share_token IS NOT NULL);

-- RLS Policies: Visit Stops
CREATE POLICY "Users can view stops for accessible visits" ON visit_stops FOR SELECT USING (
  EXISTS (SELECT 1 FROM site_visits WHERE site_visits.id = visit_stops.site_visit_id)
);
CREATE POLICY "Authenticated users can manage stops" ON visit_stops FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies: Profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
