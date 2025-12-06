-- Migration 006: Content Analytics
-- Tracks asset views and adds view count/featured flag to assets

-- Create asset_views table for detailed tracking
CREATE TABLE IF NOT EXISTS asset_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  language TEXT CHECK (language IN ('en', 'es', 'both')),
  referrer TEXT,
  user_agent TEXT
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_asset_views_asset_id ON asset_views(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_views_viewed_at ON asset_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_views_property ON asset_views(property_id);

-- Add view_count and is_featured to assets table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'view_count') THEN
    ALTER TABLE assets ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'is_featured') THEN
    ALTER TABLE assets ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create a function to increment view count
CREATE OR REPLACE FUNCTION increment_asset_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE assets SET view_count = view_count + 1 WHERE id = NEW.asset_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment view count on insert
DROP TRIGGER IF EXISTS trigger_increment_view_count ON asset_views;
CREATE TRIGGER trigger_increment_view_count
  AFTER INSERT ON asset_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_asset_view_count();

-- Enable RLS on asset_views
ALTER TABLE asset_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views (public tracking)
CREATE POLICY "Anyone can insert asset views" ON asset_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can read views
CREATE POLICY "Authenticated users can read asset views" ON asset_views
  FOR SELECT TO authenticated
  USING (true);

-- Create a view for popular assets (last 30 days)
CREATE OR REPLACE VIEW popular_assets AS
SELECT
  a.id,
  a.name,
  a.asset_type,
  a.category,
  a.thumbnail_url,
  a.description,
  a.view_count,
  COUNT(av.id) AS recent_views
FROM assets a
LEFT JOIN asset_views av ON a.id = av.asset_id
  AND av.viewed_at > NOW() - INTERVAL '30 days'
WHERE a.is_active = true
GROUP BY a.id
ORDER BY recent_views DESC, a.view_count DESC;

-- Grant access to the view
GRANT SELECT ON popular_assets TO anon, authenticated;

-- Mark some initial featured assets
UPDATE assets SET is_featured = true WHERE name IN (
  'Hotel Factsheet',
  'Wedding Packages 2025',
  'Spa Factsheet',
  'Resort Map'
);

-- Migration complete
