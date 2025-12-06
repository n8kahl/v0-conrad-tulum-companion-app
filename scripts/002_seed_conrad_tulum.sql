-- Seed data for Conrad Tulum Riviera Maya
-- Updated with real URLs from Conrad Tulum MICE materials

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
    "address": "Carretera Cancun Tulum 307, Tulum, Quintana Roo, Mexico 77774",
    "coordinates": {"lat": 20.2, "lng": -87.4},
    "airport_code": "CUN",
    "transfer_time": "2 hours from Cancun International Airport"
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
    (prop_id, 'Meetings & Incentives', 'Transform your corporate events into unforgettable experiences with world-class facilities and bespoke services.', '/images/conrad/p01_img12_xref619.jpeg', 1),
    (prop_id, 'Executive Retreats', 'Intimate settings for strategic planning and leadership development in paradise.', '/images/conrad/p01_img11_xref482.png', 2),
    (prop_id, 'Weddings & Celebrations', 'Create magical moments with stunning ocean backdrops and personalized celebration packages.', '/images/conrad/p02_img06_xref686.jpeg', 3),
    (prop_id, 'Wellness Experiences', 'Rejuvenate mind and body with spa buyouts, wellness programs, and holistic retreats.', '/images/conrad/p02_img03_xref654.png', 4),
    (prop_id, 'Flavors of Tulum', 'Curated culinary journeys celebrating local ingredients and Mayan traditions.', '/images/conrad/p01_img10_xref477.png', 5)
  ON CONFLICT DO NOTHING;

  -- Insert Assets: Core Sales Tools
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Hotel Factsheet', 'flipbook', 'sales', 'both',
      '{"flipbook_en": "https://heyzine.com/flip-book/CUNCI_Factsheet_ENG.html", "flipbook_es": "https://heyzine.com/flip-book/CUNCI_Factsheet_ESP.html", "pdf": "https://drive.google.com/drive/folders/1mfyeOVd4Bqr4FJ7r7257t3vsll_pX93Z"}',
      '/images/conrad/p01_img02_xref437.png',
      ARRAY['overview', 'factsheet', 'general', 'collection:meetings'],
      'Comprehensive overview of Conrad Tulum facilities, amenities, and services.', 1),

    (prop_id, 'Gate to Gate Experience', 'flipbook', 'sales', 'both',
      '{"flipbook_en": "https://heyzine.com/flip-book/GatetogateEng_Cunci.html", "flipbook_es": "https://heyzine.com/flip-book/GatetogateSP_Cunci.html", "pdf": "https://drive.google.com/drive/folders/1K9_OPBdkhWCBAnpnYqKr9tz1AJC1wdyD"}',
      '/images/conrad/p01_img04_xref447.png',
      ARRAY['transportation', 'arrival', 'journey', 'collection:meetings'],
      'Complete arrival experience from Cancun airport to resort.', 2),

    (prop_id, 'Transportation Guide', 'flipbook', 'sales', 'both',
      '{"flipbook_en": "https://heyzine.com/flip-book/OnpropertyTR_Cunci.html", "flipbook_es": "https://heyzine.com/flip-book/TransportacionCunci.html", "pdf": "https://drive.google.com/drive/folders/1yXtEvGNJzAZ1ig9W3oTqP_MvLcTX-BpD"}',
      '/images/conrad/p01_img05_xref452.png',
      ARRAY['transportation', 'logistics', 'transfers', 'collection:meetings'],
      'Transfer options and logistics for groups.', 3),

    (prop_id, 'Ceiba Club Factsheet', 'flipbook', 'sales', 'both',
      '{"flipbook_en": "https://heyzine.com/flip-book/FsceibaENG.html", "flipbook_es": "https://heyzine.com/flip-book/FsceibaSP.html", "pdf": "https://drive.google.com/drive/folders/1vNBM9G1ykF4wwD7hte6kT_ycptzvjqod"}',
      '/images/conrad/p01_img06_xref457.png',
      ARRAY['ceiba', 'exclusive', 'premium', 'collection:meetings'],
      'Exclusive Ceiba Club tier benefits and amenities.', 4),

    (prop_id, 'Flavors of Tulum - Groups', 'flipbook', 'events', 'en',
      '{"flipbook": "https://heyzine.com/flip-book/FS_FoT_Groups.html", "shelf": "https://heyzine.com/shelf/Flavors-of-tulum-cunci.html"}',
      '/images/conrad/p01_img07_xref462.png',
      ARRAY['dining', 'culinary', 'groups', 'F&B'],
      'Themed culinary experiences for group programs.', 5),

    (prop_id, 'Flavors of Tulum - Individual', 'flipbook', 'events', 'en',
      '{"flipbook": "https://heyzine.com/flip-book/FS_FoT_Single.html", "shelf": "https://heyzine.com/shelf/Flavors-of-tulum-cunci.html", "pdf": "https://drive.google.com/drive/folders/1-bVMdJmI24LZUAXvJMu64rkNjmR-AWlR"}',
      '/images/conrad/p01_img08_xref467.png',
      ARRAY['dining', 'culinary', 'individual', 'F&B'],
      'Individual dining experiences and restaurant options.', 6),

    (prop_id, 'Resort Map', 'flipbook', 'sales', 'es',
      '{"flipbook": "https://heyzine.com/flip-book/ResortMapCunci.html", "pdf": "https://drive.google.com/file/d/1jWdIalMVd6JWY3r1Ukiw820ldzsoPvM8/view"}',
      '/images/conrad/p01_img09_xref472.png',
      ARRAY['map', 'layout', 'navigation', 'collection:meetings'],
      'Complete resort layout and venue locations.', 7),

    (prop_id, 'Themed Events - Spark Delight', 'flipbook', 'events', 'both',
      '{"flipbook": "https://heyzine.com/flip-book/CUNCI_ThemedEvents.html", "shelf": "https://heyzine.com/shelf/MICEmaterialscunci.html"}',
      '/images/conrad/p01_img03_xref442.png',
      ARRAY['events', 'themed', 'entertainment'],
      'Signature themed event concepts and packages.', 8),

    (prop_id, 'Festive Program 2025', 'flipbook', 'events', 'both',
      '{"flipbook": "https://heyzine.com/flip-book/FestiveProgram-Cunci.html", "pdf": "https://drive.google.com/file/d/1J-JGnYU4sdxHHFDRghA2EF_xidNl0sE1/view"}',
      '/images/conrad/p01_img10_xref477.png',
      ARRAY['festive', 'holiday', '2025'],
      'Holiday season programming and special events.', 9),

    (prop_id, 'MICE Materials Collection', 'flipbook', 'sales', 'both',
      '{"shelf": "https://heyzine.com/shelf/CUNCI_MICE_Materials.html", "downloads": "https://drive.google.com/drive/folders/1vs4lVb4SoMwukNKaX7ebwehvxIdeQkkd"}',
      '/images/conrad/p01_img11_xref482.png',
      ARRAY['collection', 'sales', 'complete', 'collection:meetings'],
      'Complete collection of all MICE sales materials.', 10)
  ON CONFLICT DO NOTHING;

  -- Insert Assets: Virtual Tours & Video
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'FirstView Virtual Tour', 'virtual_tour', 'marketing', 'en',
      '{"tour_url": "https://conrad-tulum-riviera-maya.firstview.us/en"}',
      '/images/conrad/p01_img12_xref619.jpeg',
      ARRAY['virtual', 'tour', '360', 'featured'],
      'Interactive 360 degree virtual tour of the resort.', 11),

    (prop_id, 'TrueTour Experience', 'virtual_tour', 'marketing', 'en',
      '{"tour_url": "https://visitingmedia.com/tt8/?ttid=conrad-tulum-riviera-maya#/3d-model/1/1"}',
      '/images/conrad/p01_img13_xref624.png',
      ARRAY['virtual', 'immersive', 'tour', '3d'],
      'Immersive 3D guided virtual experience.', 12),

    (prop_id, 'Conrad Tulum Brand Video', 'video', 'marketing', 'en',
      '{"youtube": "https://www.youtube.com/watch?v=XFCculW6XKI", "videos_drive": "https://drive.google.com/drive/folders/1HrNRmQCj0E7s39d5DFmeco4NDnb1ohts"}',
      '/images/conrad/p01_img02_xref437.png',
      ARRAY['video', 'brand', 'overview', 'featured'],
      'Cinematic brand video showcasing the Conrad Tulum experience.', 13)
  ON CONFLICT DO NOTHING;

  -- Insert Assets: Weddings
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Wedding Packages 2025', 'flipbook', 'weddings', 'both',
      '{"flipbook_en": "https://heyzine.com/flip-book/brochureweddings2025Eng.html", "flipbook_es": "https://heyzine.com/flip-book/Brochureweddings2025Sp.html", "pdf": "https://drive.google.com/drive/folders/1KH9SdkUdBoJ0G9Ofalui2ty_Ob4HZIVy"}',
      '/images/conrad/p02_img06_xref686.jpeg',
      ARRAY['wedding', '2025', 'packages', 'collection:weddings'],
      'Complete wedding packages for 2025 celebrations.', 20),

    (prop_id, 'Wedding Packages 2026', 'flipbook', 'weddings', 'both',
      '{"flipbook_en": "https://heyzine.com/flip-book/Brochureweddings2026Eng.html", "flipbook_es": "https://heyzine.com/flip-book/Brochureweddings2026Sp.html", "pdf": "https://drive.google.com/drive/folders/1_q3LmG_0EHu4S_rU5qw-sdb0Zm-Zy_4T"}',
      '/images/conrad/p02_img07_xref691.png',
      ARRAY['wedding', '2026', 'packages', 'collection:weddings'],
      'Advance booking wedding packages for 2026.', 21),

    (prop_id, 'Weddings Gallery', 'flipbook', 'weddings', 'en',
      '{"flipbook": "https://heyzine.com/flip-book/WeddingsGallery_CUNCI.html", "pdf": "https://drive.google.com/file/d/1XXEX5K8ZDhz2AKT7g16JNqTb_CtzI8Z3/view"}',
      '/images/conrad/p02_img04_xref677.png',
      ARRAY['gallery', 'weddings', 'photos', 'collection:weddings'],
      'Inspiration gallery of past wedding celebrations.', 22)
  ON CONFLICT DO NOTHING;

  -- Insert Assets: Spa & Wellness
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Spa Menu', 'flipbook', 'spa', 'both',
      '{"flipbook_en": "https://heyzine.com/flip-book/Menu-Spa-Ing.html", "flipbook_es": "https://heyzine.com/flip-book/Menu-Spa-Esp.html", "pdf": "https://drive.google.com/drive/folders/1AspUzGfnacOaxV7nObXJMVO23uQYUtBQ"}',
      '/images/conrad/p02_img03_xref654.png',
      ARRAY['spa', 'treatments', 'wellness', 'menu'],
      'Complete spa treatment menu and pricing.', 30),

    (prop_id, 'Spa Factsheet', 'flipbook', 'spa', 'both',
      '{"flipbook_en": "https://heyzine.com/flip-book/Fs-Spa-Eng.html", "flipbook_es": "https://heyzine.com/flip-book/Fs-spa-Sp.html", "pdf": "https://drive.google.com/drive/folders/1mfyeOVd4Bqr4FJ7r7257t3vsll_pX93Z"}',
      '/images/conrad/p02_img02_xref649.png',
      ARRAY['spa', 'facilities', 'overview'],
      'Spa facilities overview and group options.', 31)
  ON CONFLICT DO NOTHING;

  -- Insert Assets: Events & Groups Gallery
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Hotel Events Gallery', 'flipbook', 'events', 'en',
      '{"flipbook": "https://heyzine.com/flip-book/HotelEventsGallery_CUNCI.html", "pdf": "https://drive.google.com/file/d/1OSTtT8FeCbcaDk0ukcohGcYjCkWTcBel/view"}',
      '/images/conrad/p01_img11_xref482.png',
      ARRAY['gallery', 'groups', 'events', 'photos', 'collection:meetings'],
      'Inspiration gallery of past group events and meetings.', 40)
  ON CONFLICT DO NOTHING;

  -- Insert Assets: Resource Links (using 'pdf' type for external resource links, 'marketing' category)
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order) VALUES
    (prop_id, 'Image Library', 'pdf', 'marketing', 'en',
      '{"pdf": "https://drive.google.com/drive/folders/1VThV7QgZITVg3nGq7aiDQIcsfRUzV1Ix"}',
      '/images/conrad/p01_img12_xref619.jpeg',
      ARRAY['images', 'photos', 'download', 'resources'],
      'High-resolution image library for presentations and proposals.', 50),

    (prop_id, 'Logo Package', 'pdf', 'marketing', 'en',
      '{"pdf": "https://drive.google.com/drive/folders/1uZ47Pb2wBt6YHfvFoIVDfWHAx3Gp_dl-"}',
      '/images/conrad/p01_img01_xref250.png',
      ARRAY['logos', 'branding', 'download', 'resources'],
      'Official Conrad Tulum logos in various formats.', 51),

    (prop_id, 'Video Library', 'video', 'marketing', 'en',
      '{"youtube": "https://drive.google.com/drive/folders/1HrNRmQCj0E7s39d5DFmeco4NDnb1ohts"}',
      '/images/conrad/p01_img02_xref437.png',
      ARRAY['videos', 'download', 'resources'],
      'Video content library for marketing and presentations.', 52),

    (prop_id, 'Press & Media Kit', 'pdf', 'marketing', 'en',
      '{"pdf": "https://stories.hilton.com/releases/conrad-tulum-riviera-maya-ushers-in-era-of-luxury"}',
      '/images/conrad/p01_img03_xref442.png',
      ARRAY['press', 'media', 'news', 'resources'],
      'Press releases and media coverage about Conrad Tulum.', 53)
  ON CONFLICT DO NOTHING;

  -- Insert Venues with local images from PDF export
  -- First image in array is the primary/cover image
  INSERT INTO venues (property_id, name, venue_type, capacities, dimensions, features, description, images) VALUES
    (prop_id, 'Conrad Ballroom', 'ballroom',
      '{"theater": 250, "classroom": 100, "banquet": 250, "reception": 250, "u_shape": 60}',
      '{"length_m": 23, "width_m": 11, "height_m": 4, "sqm": 277}',
      ARRAY['natural_light', 'av_built_in', 'elegant_finishes', 'pre_function_area'],
      'Elegant event space with sophisticated finishes, ideal for galas and corporate presentations.',
      ARRAY['/images/conrad/p02_img07_xref691.png']),

    (prop_id, 'Tulkal Ballroom', 'ballroom',
      '{"theater": 700, "classroom": 400, "banquet": 300, "reception": 400, "u_shape": 100}',
      '{"length_m": 43, "width_m": 16, "height_m": 6, "sqm": 688}',
      ARRAY['natural_light', 'av_built_in', 'divisible', 'pre_function_area', 'outdoor_access'],
      'Our flagship event space - the largest ballroom with stunning ocean views and flexible configurations.',
      ARRAY['/images/conrad/p02_img07_xref691.png', '/images/conrad/p01_img10_xref477.png']),

    (prop_id, 'Tulkalito', 'meeting_room',
      '{"theater": 830, "classroom": 405, "banquet": 590, "reception": 729, "u_shape": 120}',
      '{"length_m": 25, "width_m": 32, "height_m": 5, "sqm": 857}',
      ARRAY['natural_light', 'av_built_in', 'divisible', 'flexible_layout'],
      'Versatile meeting pavilion with modular configurations for groups of any size.',
      ARRAY['/images/conrad/p01_img04_xref447.png', '/images/conrad/p01_img08_xref467.png']),

    (prop_id, 'Coba Terrace', 'outdoor',
      '{"reception": 500, "banquet": 400, "ceremony": 400}',
      '{"length_m": 16, "width_m": 8, "sqm": 145}',
      ARRAY['ocean_view', 'sunset_backdrop', 'natural_setting', 'covered_option'],
      'Stunning outdoor terrace with panoramic Caribbean views, perfect for sunset events.',
      ARRAY['/images/conrad/p01_img04_xref447.png', '/images/conrad/p01_img03_xref442.png']),

    (prop_id, 'Serrano Boardroom', 'meeting_room',
      '{"boardroom": 12, "u_shape": 10}',
      '{"length_m": 9, "width_m": 6, "sqm": 54}',
      ARRAY['natural_light', 'av_built_in', 'private', 'executive_level'],
      'Intimate boardroom for executive meetings and strategic planning sessions.',
      ARRAY['/images/conrad/p01_img06_xref457.png']),

    (prop_id, 'Carbon Beach', 'beach',
      '{"reception": 200, "banquet": 150, "ceremony": 200}',
      '{"sqm": 500}',
      ARRAY['beachfront', 'sunset_view', 'casual_elegant', 'entertainment_area', 'bonfire_option'],
      'Pristine beachfront venue perfect for welcome receptions, beach parties, and ceremonies.',
      ARRAY['/images/conrad/p01_img10_xref477.png', '/images/conrad/p01_img03_xref442.png']),

    (prop_id, 'Spa Cenote', 'spa',
      '{"wellness_group": 30, "buyout": 50}',
      '{"sqm": 400}',
      ARRAY['wellness_focused', 'tranquil', 'outdoor_indoor', 'treatment_rooms', 'cenote_experience'],
      'Unique spa experience inspired by the sacred cenotes, offering group wellness programs.',
      ARRAY['/images/conrad/p02_img03_xref654.png', '/images/conrad/p01_img11_xref482.png']),

    (prop_id, 'Main Pool', 'pool',
      '{"reception": 300, "casual_dining": 150}',
      '{"sqm": 600}',
      ARRAY['pool_access', 'day_events', 'casual', 'tropical_setting', 'lounge_chairs'],
      'Vibrant infinity pool area ideal for daytime events and cocktail receptions.',
      ARRAY['/images/conrad/p01_img02_xref437.png', '/images/conrad/p01_img03_xref442.png']),

    (prop_id, 'Lobby & Water Mirror', 'lobby',
      '{"reception": 100, "networking": 80}',
      '{"sqm": 250}',
      ARRAY['arrival_experience', 'first_impression', 'elegant', 'water_feature', 'photo_opportunity'],
      'Grand arrival space featuring the iconic water mirror, showcasing resort elegance.',
      ARRAY['/images/conrad/p01_img07_xref462.png', '/images/conrad/p02_img06_xref686.jpeg']),

    (prop_id, 'Carbon Garden', 'outdoor',
      '{"reception": 250, "banquet": 180, "ceremony": 200}',
      '{"sqm": 400}',
      ARRAY['garden_setting', 'natural_backdrop', 'evening_events', 'lighting_options'],
      'Lush tropical garden venue for intimate outdoor gatherings and ceremonies.',
      ARRAY['/images/conrad/p01_img04_xref447.png']),

    (prop_id, 'Arbolea Restaurant', 'restaurant',
      '{"banquet": 80, "reception": 120}',
      '{"sqm": 200}',
      ARRAY['fine_dining', 'terrace_option', 'private_buyout', 'wine_program'],
      'Signature restaurant featuring contemporary Mexican cuisine with terrace views.',
      ARRAY['/images/conrad/p01_img03_xref442.png']),

    (prop_id, 'Autor Restaurant', 'restaurant',
      '{"banquet": 40, "reception": 60}',
      '{"sqm": 120}',
      ARRAY['intimate', 'chef_table', 'culinary_experience', 'wine_pairing'],
      'Exclusive chef-driven dining experience for intimate culinary events.',
      ARRAY['/images/conrad/p02_img04_xref677.png']),

    (prop_id, 'Kengai Restaurant', 'restaurant',
      '{"banquet": 60, "reception": 80}',
      '{"sqm": 150}',
      ARRAY['asian_cuisine', 'teppanyaki', 'private_dining', 'group_experience'],
      'Japanese-inspired restaurant with teppanyaki experience for group dining.',
      ARRAY['/images/conrad/p01_img04_xref447.png']),

    (prop_id, 'Maratea Restaurant', 'restaurant',
      '{"banquet": 50, "reception": 70}',
      '{"sqm": 140}',
      ARRAY['mediterranean', 'seafood', 'ocean_view', 'romantic_setting'],
      'Mediterranean-inspired cuisine with fresh seafood and ocean views.',
      ARRAY['/images/conrad/p01_img03_xref442.png']),

    (prop_id, 'Chaak Bar', 'restaurant',
      '{"reception": 60, "casual_dining": 40}',
      '{"sqm": 100}',
      ARRAY['cocktails', 'casual', 'pool_adjacent', 'networking'],
      'Stylish poolside bar perfect for casual networking and cocktail receptions.',
      ARRAY['/images/conrad/p01_img02_xref437.png']),

    (prop_id, 'Chiringuito Carbon', 'beach',
      '{"reception": 80, "casual_dining": 50}',
      '{"sqm": 120}',
      ARRAY['beachfront', 'casual', 'grill', 'barefoot_luxury'],
      'Casual beachfront grill for relaxed seaside dining experiences.',
      ARRAY['/images/conrad/p01_img03_xref442.png', '/images/conrad/p01_img10_xref477.png'])
  ON CONFLICT DO NOTHING;

END $$;

-- Social media and contact info reference (for property settings):
-- Facebook: https://www.facebook.com/ConradTulumRivieraMaya/
-- Instagram: https://www.instagram.com/conradtulumrivieramaya/
-- LinkedIn: https://www.linkedin.com/company/conrad-tulum-riviera-maya1/
-- YouTube: https://www.youtube.com/watch?v=XFCculW6XKI
-- Website: https://conradtulumrivieramaya.com/
-- Hilton: https://www.hilton.com/en/hotels/cuncici-conrad-tulum-riviera-maya/
-- Sales Contacts:
--   Irais Salinas: Irais.Salinas@Hilton.com
--   Cicialli Velazquez: Cicialli.Velazquez@Hilton.com
--   Valeria Aquino: Valeria.Aquino@ConradHotels.com
--   Karina Sierra: Karina.Sierra@Hilton.com
