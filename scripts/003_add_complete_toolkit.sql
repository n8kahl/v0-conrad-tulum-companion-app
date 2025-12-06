-- Add complete sales toolkit from MICE_CUNCI_2025 PDF
-- This script adds all missing assets and updates existing ones with proper URLs

DO $$
DECLARE
  prop_id UUID;
  meetings_collection_id UUID;
  weddings_collection_id UUID;
  wellness_collection_id UUID;
  flavors_collection_id UUID;
BEGIN
  SELECT id INTO prop_id FROM properties WHERE slug = 'conrad-tulum';
  
  -- Get collection IDs for linking
  SELECT id INTO meetings_collection_id FROM collections WHERE property_id = prop_id AND name = 'Meetings & Incentives';
  SELECT id INTO weddings_collection_id FROM collections WHERE property_id = prop_id AND name = 'Weddings & Celebrations';
  SELECT id INTO wellness_collection_id FROM collections WHERE property_id = prop_id AND name = 'Wellness Experiences';
  SELECT id INTO flavors_collection_id FROM collections WHERE property_id = prop_id AND name = 'Flavors of Tulum';

  -- Add new collection for Marketing Tools
  INSERT INTO collections (property_id, name, description, cover_image_url, sort_order) VALUES
    (prop_id, 'Marketing Tools', 'Virtual tours, diagramming tools, and digital resources for presentations and client engagement.', '/placeholder.svg?height=600&width=800', 6)
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- SALES TOOLS AND MATERIALS
  -- =====================================================
  
  -- Changed 'gallery' to 'image' for valid enum
  -- Hotel Assets - Images
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Hotel Image Library', 'image', 'marketing', 'en', 
     '{"download_url": "#", "drive_folder": "#"}', 
     '/placeholder.svg?height=400&width=300', 
     ARRAY['images', 'photography', 'marketing', 'media'], 
     'High-resolution professional photography of resort facilities, rooms, and amenities.', 30)
  ON CONFLICT DO NOTHING;

  -- Changed 'gallery' to 'image' for valid enum
  -- Hotel Assets - Logos
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Brand Logos & Assets', 'image', 'marketing', 'en', 
     '{"download_url": "#", "drive_folder": "#"}', 
     '/placeholder.svg?height=400&width=300', 
     ARRAY['logos', 'branding', 'identity', 'media'], 
     'Official Conrad Tulum logos in various formats for marketing materials.', 31)
  ON CONFLICT DO NOTHING;

  -- Hotel Assets - FirstView Media
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'FirstView Media Gallery', 'virtual_tour', 'marketing', 'en', 
     '{"firstview_url": "#", "media_gallery": "#"}', 
     '/placeholder.svg?height=400&width=300', 
     ARRAY['firstview', 'media', '360', 'virtual', 'tour'], 
     'Interactive FirstView 360° media content for immersive presentations.', 32)
  ON CONFLICT DO NOTHING;

  -- Hotel Assets - Videos
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Promotional Videos', 'video', 'marketing', 'both', 
     '{"video_en": "#", "video_es": "#", "download_url": "#"}', 
     '/placeholder.svg?height=400&width=300', 
     ARRAY['video', 'promotional', 'cinematic', 'marketing'], 
     'Professional video content showcasing the Conrad Tulum experience.', 33)
  ON CONFLICT DO NOTHING;

  -- Bookshelves
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Digital Bookshelves', 'flipbook', 'marketing', 'both', 
     '{"flipbook_url": "#", "all_flipbooks": "#"}', 
     '/placeholder.svg?height=400&width=300', 
     ARRAY['bookshelves', 'flipbooks', 'library', 'digital'], 
     'Complete digital library of all Conrad Tulum flipbooks and materials.', 34)
  ON CONFLICT DO NOTHING;

  -- Marketing Tools - Virtual Tours
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'TrueTour Virtual Experience', 'virtual_tour', 'marketing', 'en', 
     '{"truetour_url": "#"}', 
     '/placeholder.svg?height=400&width=300', 
     ARRAY['truetour', 'virtual', 'immersive', '360', 'interactive'], 
     'Immersive TrueTour virtual experience for remote site visits.', 35)
  ON CONFLICT DO NOTHING;

  -- Changed 'tool' to 'diagram' for valid enum
  -- Marketing Tools - Diagramming (FirstView)
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'FirstView Diagramming Tool', 'diagram', 'marketing', 'en', 
     '{"firstview_diagram_url": "#"}', 
     '/placeholder.svg?height=400&width=300', 
     ARRAY['firstview', 'diagramming', 'floorplan', 'events', 'planning'], 
     'Interactive diagramming tool for event space planning and layouts.', 36)
  ON CONFLICT DO NOTHING;

  -- Changed 'download' to 'pdf' for valid enum
  -- Download All Assets
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Complete Asset Download', 'pdf', 'sales', 'both', 
     '{"drive_link": "#", "download_all": "#"}', 
     '/placeholder.svg?height=400&width=300', 
     ARRAY['download', 'complete', 'allassets', 'drive'], 
     'One-click access to download all Conrad Tulum sales and marketing materials.', 37)
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- WEDDINGS, SPA TOOLS AND MATERIALS (ensure complete)
  -- =====================================================

  -- Changed 'gallery' to 'image' for valid enum
  -- Events Gallery - Weddings
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Wedding Events Gallery', 'image', 'weddings', 'en', 
     '{"flipbook": "#", "pdf": "#", "gallery_url": "#"}', 
     '/placeholder.svg?height=400&width=300', 
     ARRAY['wedding', 'gallery', 'inspiration', 'photos', 'events'], 
     'Stunning inspiration gallery showcasing past wedding celebrations at Conrad Tulum.', 40)
  ON CONFLICT DO NOTHING;

  -- Changed 'gallery' to 'image' for valid enum
  -- Events Gallery - Groups
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Group Events Gallery', 'image', 'events', 'en', 
     '{"flipbook": "#", "pdf": "#", "gallery_url": "#"}', 
     '/placeholder.svg?height=400&width=300', 
     ARRAY['groups', 'gallery', 'corporate', 'events', 'inspiration'], 
     'Portfolio of successful group events, conferences, and celebrations.', 41)
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- SOCIAL MEDIA & CONTACTS (stored in property metadata)
  -- =====================================================

  -- Changed 'link' to 'pdf' for valid enum (social links stored in urls JSON)
  -- Social Media Links
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Social Media Channels', 'pdf', 'marketing', 'both', 
     '{"instagram": "https://instagram.com/conradtulum", "facebook": "https://facebook.com/conradtulum", "website": "https://conradtulumrivieramaya.com/", "hilton": "https://www.hilton.com/en/hotels/cuncici-conrad-tulum-riviera-maya/"}', 
     '/placeholder.svg?height=400&width=300', 
     ARRAY['social', 'instagram', 'facebook', 'website', 'digital'], 
     'Official Conrad Tulum social media channels and website links.', 50)
  ON CONFLICT DO NOTHING;

  -- Changed 'contact' to 'pdf' for valid enum (contact info stored in urls JSON)
  -- Marketing Contacts
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Marketing Contacts', 'pdf', 'sales', 'both', 
     '{"contacts": [{"name": "Cici", "role": "Marketing Contact", "email": "#"}, {"name": "Irais Valekari", "role": "Marketing Contact", "email": "#"}]}', 
     '/placeholder.svg?height=400&width=300', 
     ARRAY['contacts', 'marketing', 'team', 'support'], 
     'Direct marketing contacts for Conrad Tulum: Cici and Irais Valekari.', 51)
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- PROPERTY INFO UPDATE
  -- =====================================================
  
  -- Update property with complete info
  UPDATE properties 
  SET 
    location = '{
      "address": "Carretera Cancún Tulum 307, Tulum, Quintana Roo, México 77774",
      "coordinates": {"lat": 20.2, "lng": -87.4},
      "airport_code": "CUN",
      "transfer_time": "2 hours from Cancún International Airport",
      "region": "Riviera Maya",
      "country": "Mexico",
      "website": "https://conradtulumrivieramaya.com/",
      "hilton_url": "https://www.hilton.com/en/hotels/cuncici-conrad-tulum-riviera-maya/",
      "marketing_contacts": [
        {"name": "Cici", "role": "Marketing"},
        {"name": "Irais Valekari", "role": "Marketing"}
      ]
    }'::jsonb
  WHERE slug = 'conrad-tulum';

END $$;

-- Add asset collection associations
DO $$
DECLARE
  prop_id UUID;
  meetings_id UUID;
  weddings_id UUID;
  wellness_id UUID;
  flavors_id UUID;
  marketing_id UUID;
BEGIN
  SELECT id INTO prop_id FROM properties WHERE slug = 'conrad-tulum';
  SELECT id INTO meetings_id FROM collections WHERE property_id = prop_id AND name = 'Meetings & Incentives';
  SELECT id INTO weddings_id FROM collections WHERE property_id = prop_id AND name = 'Weddings & Celebrations';
  SELECT id INTO wellness_id FROM collections WHERE property_id = prop_id AND name = 'Wellness Experiences';
  SELECT id INTO flavors_id FROM collections WHERE property_id = prop_id AND name = 'Flavors of Tulum';
  SELECT id INTO marketing_id FROM collections WHERE property_id = prop_id AND name = 'Marketing Tools';

  -- Link assets to collections via tags
  -- Marketing Tools collection
  UPDATE assets SET tags = array_append(tags, 'collection:marketing-tools')
  WHERE property_id = prop_id AND category = 'marketing';
  
  -- Weddings collection
  UPDATE assets SET tags = array_append(tags, 'collection:weddings')
  WHERE property_id = prop_id AND category = 'weddings';
  
  -- Spa/Wellness collection  
  UPDATE assets SET tags = array_append(tags, 'collection:wellness')
  WHERE property_id = prop_id AND category = 'spa';
  
  -- Events/Meetings collection
  UPDATE assets SET tags = array_append(tags, 'collection:meetings')
  WHERE property_id = prop_id AND category IN ('events', 'sales');

END $$;
