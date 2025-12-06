-- Seed data for Conrad Tulum Riviera Maya

-- Insert Conrad Tulum property
INSERT INTO properties (name, slug, brand_colors, location) VALUES (
  'Conrad Tulum Riviera Maya',
  'conrad-tulum',
  '{
    "primary": "#C4A052",
    "secondary": "#2D2D2D",
    "accent": "#D4AF37",
    "background": "#FAF9F6",
    "text": "#1A1A1A"
  }',
  '{
    "address": "Carretera Cancún Tulum 307, Tulum, Quintana Roo, México 77774",
    "coordinates": {"lat": 20.2, "lng": -87.4},
    "airport_code": "CUN",
    "transfer_time": "2 hours from Cancún International Airport"
  }'
) ON CONFLICT (slug) DO NOTHING;

-- Get the property ID for subsequent inserts
DO $$
DECLARE
  prop_id UUID;
BEGIN
  SELECT id INTO prop_id FROM properties WHERE slug = 'conrad-tulum';

  -- Insert Collections
  INSERT INTO collections (property_id, name, description, cover_image_url, sort_order) VALUES
    (prop_id, 'Meetings & Incentives', 'Transform your corporate events into unforgettable experiences with world-class facilities and bespoke services.', '/placeholder.svg?height=600&width=800', 1),
    (prop_id, 'Executive Retreats', 'Intimate settings for strategic planning and leadership development in paradise.', '/placeholder.svg?height=600&width=800', 2),
    (prop_id, 'Weddings & Celebrations', 'Create magical moments with stunning ocean backdrops and personalized celebration packages.', '/placeholder.svg?height=600&width=800', 3),
    (prop_id, 'Wellness Experiences', 'Rejuvenate mind and body with spa buyouts, wellness programs, and holistic retreats.', '/placeholder.svg?height=600&width=800', 4),
    (prop_id, 'Flavors of Tulum', 'Curated culinary journeys celebrating local ingredients and Mayan traditions.', '/placeholder.svg?height=600&width=800', 5)
  ON CONFLICT DO NOTHING;

  -- Insert Assets: Sales Tools
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Hotel Factsheet', 'flipbook', 'sales', 'both', '{"flipbook_en": "#", "flipbook_es": "#", "pdf_en": "#", "pdf_es": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['overview', 'factsheet', 'general'], 'Comprehensive overview of Conrad Tulum facilities, amenities, and services.', 1),
    (prop_id, 'Gate to Gate Experience', 'flipbook', 'sales', 'both', '{"flipbook_en": "#", "flipbook_es": "#", "pdf": "#", "firstview": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['transportation', 'arrival', 'journey'], 'Complete arrival experience from Cancún airport to resort.', 2),
    (prop_id, 'Transportation Guide', 'flipbook', 'sales', 'both', '{"flipbook_en": "#", "flipbook_es": "#", "pdf": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['transportation', 'logistics', 'transfers'], 'Transfer options and logistics for groups.', 3),
    (prop_id, 'Ceiba Club Factsheet', 'flipbook', 'sales', 'both', '{"flipbook_en": "#", "flipbook_es": "#", "pdf": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['ceiba', 'exclusive', 'premium'], 'Exclusive Ceiba Club tier benefits and amenities.', 4),
    (prop_id, 'Flavors of Tulum - Groups', 'flipbook', 'events', 'en', '{"flipbook": "#", "pdf": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['dining', 'culinary', 'groups', 'F&B'], 'Themed culinary experiences for group programs.', 5),
    (prop_id, 'Flavors of Tulum - Individual', 'flipbook', 'events', 'en', '{"flipbook": "#", "pdf": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['dining', 'culinary', 'individual', 'F&B'], 'Individual dining experiences and restaurant options.', 6),
    (prop_id, 'Resort Map', 'flipbook', 'sales', 'es', '{"flipbook": "#", "pdf": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['map', 'layout', 'navigation'], 'Complete resort layout and venue locations.', 7),
    (prop_id, 'Themed Events - Spark Delight', 'flipbook', 'events', 'both', '{"flipbook": "#", "pdf": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['events', 'themed', 'entertainment'], 'Signature themed event concepts and packages.', 8),
    (prop_id, 'Festive Program 2025', 'flipbook', 'events', 'both', '{"flipbook_en": "#", "flipbook_es": "#", "pdf": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['festive', 'holiday', '2025'], 'Holiday season programming and special events.', 9),
    (prop_id, 'FirstView Virtual Tour', 'virtual_tour', 'marketing', 'en', '{"tour_url": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['virtual', 'tour', '360'], 'Interactive 360° virtual tour of the resort.', 10),
    (prop_id, 'TrueTour Experience', 'virtual_tour', 'marketing', 'en', '{"tour_url": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['virtual', 'immersive', 'tour'], 'Immersive guided virtual experience.', 11)
  ON CONFLICT DO NOTHING;

  -- Insert Assets: Weddings & Spa
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Wedding Packages 2025', 'flipbook', 'weddings', 'both', '{"flipbook_en": "#", "flipbook_es": "#", "pdf": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['wedding', '2025', 'packages'], 'Complete wedding packages for 2025 celebrations.', 20),
    (prop_id, 'Wedding Packages 2026', 'flipbook', 'weddings', 'both', '{"flipbook_en": "#", "flipbook_es": "#", "pdf": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['wedding', '2026', 'packages'], 'Advance booking wedding packages for 2026.', 21),
    (prop_id, 'Spa Menu', 'flipbook', 'spa', 'both', '{"flipbook_en": "#", "flipbook_es": "#", "pdf": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['spa', 'treatments', 'wellness'], 'Complete spa treatment menu and pricing.', 22),
    (prop_id, 'Spa Factsheet', 'flipbook', 'spa', 'both', '{"flipbook_en": "#", "flipbook_es": "#", "pdf": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['spa', 'facilities', 'overview'], 'Spa facilities overview and group options.', 23),
    (prop_id, 'Events Gallery - Weddings', 'flipbook', 'weddings', 'en', '{"flipbook": "#", "pdf": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['gallery', 'weddings', 'photos'], 'Inspiration gallery of past wedding celebrations.', 24),
    (prop_id, 'Events Gallery - Groups', 'flipbook', 'events', 'en', '{"flipbook": "#", "pdf": "#"}', '/placeholder.svg?height=400&width=300', ARRAY['gallery', 'groups', 'events', 'photos'], 'Inspiration gallery of past group events.', 25)
  ON CONFLICT DO NOTHING;

  -- Insert Venues
  INSERT INTO venues (property_id, name, venue_type, capacities, dimensions, features, description) VALUES
    (prop_id, 'Grand Ballroom', 'ballroom', '{"theater": 500, "classroom": 300, "banquet": 350, "reception": 600, "u_shape": 80}', '{"length_m": 30, "width_m": 20, "height_m": 6, "sqm": 600}', ARRAY['natural_light', 'av_built_in', 'divisible', 'pre_function_area'], 'Our flagship event space with soaring ceilings and elegant finishes.'),
    (prop_id, 'Oceanfront Lawn', 'outdoor', '{"reception": 400, "banquet": 250, "ceremony": 300}', '{"sqm": 800}', ARRAY['ocean_view', 'sunset_backdrop', 'natural_setting', 'tenting_available'], 'Stunning outdoor space with panoramic Caribbean views.'),
    (prop_id, 'Ceiba Boardroom', 'meeting_room', '{"boardroom": 20, "u_shape": 18}', '{"length_m": 10, "width_m": 6, "sqm": 60}', ARRAY['natural_light', 'av_built_in', 'private', 'executive_level'], 'Exclusive boardroom for high-level meetings.'),
    (prop_id, 'Beach Club', 'beach', '{"reception": 200, "banquet": 150}', '{"sqm": 500}', ARRAY['beachfront', 'sunset_view', 'casual_elegant', 'entertainment_area'], 'Beachfront venue perfect for welcome receptions and casual events.'),
    (prop_id, 'Spa Pavilion', 'spa', '{"wellness_group": 30, "buyout": 50}', '{"sqm": 400}', ARRAY['wellness_focused', 'tranquil', 'outdoor_indoor', 'treatment_rooms'], 'Dedicated wellness space for group spa experiences.'),
    (prop_id, 'Main Pool Terrace', 'pool', '{"reception": 300, "casual_dining": 150}', '{"sqm": 600}', ARRAY['pool_access', 'day_events', 'casual', 'tropical_setting'], 'Vibrant pool area ideal for daytime events and casual gatherings.'),
    (prop_id, 'Lobby Lounge', 'lobby', '{"reception": 100, "networking": 80}', '{"sqm": 250}', ARRAY['arrival_experience', 'first_impression', 'elegant', 'central_location'], 'Grand arrival space showcasing resort elegance.'),
    (prop_id, 'Private Dining Room', 'restaurant', '{"banquet": 40, "reception": 60}', '{"sqm": 120}', ARRAY['intimate', 'culinary_focused', 'climate_controlled', 'wine_pairing'], 'Intimate setting for exclusive dining experiences.')
  ON CONFLICT DO NOTHING;

END $$;
