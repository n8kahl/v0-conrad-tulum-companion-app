-- Update all assets with REAL URLs extracted from MICE_CUNCI_2025.pdf
-- Run this after 001, 002, and 003 migrations

DO $$
DECLARE
  prop_id UUID;
BEGIN
  SELECT id INTO prop_id FROM properties WHERE slug = 'conrad-tulum';

  -- =====================================================
  -- UPDATE EXISTING ASSETS WITH REAL URLs AND THUMBNAILS
  -- =====================================================

  -- FACTSHEET (Hotel Factsheet)
  UPDATE assets SET
    urls = '{
      "flipbook_en": "https://heyzine.com/flip-book/CUNCI_Factsheet_ENG.html",
      "flipbook_es": "https://heyzine.com/flip-book/CUNCI_Factsheet_ESP.html",
      "pdf": "https://drive.google.com/drive/folders/1mfyeOVd4Bqr4FJ7r7257t3vsll_pX93Z?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/factsheet.png'
  WHERE property_id = prop_id AND name = 'Hotel Factsheet';

  -- GATE TO GATE
  UPDATE assets SET
    urls = '{
      "flipbook_en": "https://heyzine.com/flip-book/GatetogateEng_Cunci.html",
      "flipbook_es": "https://heyzine.com/flip-book/GatetogateSP_Cunci.html",
      "firstview": "https://heyzine.com/shelf/CUNCI_MICE_Materials.html",
      "pdf": "https://drive.google.com/drive/folders/1K9_OPBdkhWCBAnpnYqKr9tz1AJC1wdyD?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/gate-to-gate.png'
  WHERE property_id = prop_id AND name = 'Gate to Gate Experience';

  -- TRANSPORTATION
  UPDATE assets SET
    urls = '{
      "flipbook_en": "https://heyzine.com/flip-book/OnpropertyTR_Cunci.html",
      "flipbook_es": "https://heyzine.com/flip-book/TransportacionCunci.html",
      "pdf": "https://drive.google.com/drive/folders/1yXtEvGNJzAZ1ig9W3oTqP_MvLcTX-BpD?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/transportation.png'
  WHERE property_id = prop_id AND name = 'Transportation Guide';

  -- CEIBA FACT SHEET
  UPDATE assets SET
    urls = '{
      "flipbook_en": "https://heyzine.com/flip-book/FsceibaENG.html",
      "flipbook_es": "https://heyzine.com/flip-book/FsceibaSP.html",
      "pdf": "https://drive.google.com/drive/folders/1vNBM9G1ykF4wwD7hte6kT_ycptzvjqod?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/ceiba-club.png'
  WHERE property_id = prop_id AND name = 'Ceiba Club Factsheet';

  -- FLAVORS OF TULUM - Groups
  UPDATE assets SET
    urls = '{
      "flipbook": "https://heyzine.com/flip-book/FS_FoT_Groups.html",
      "pdf": "https://drive.google.com/drive/folders/1-bVMdJmI24LZUAXvJMu64rkNjmR-AWlR?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/flavors-of-tulum.png'
  WHERE property_id = prop_id AND name = 'Flavors of Tulum - Groups';

  -- FLAVORS OF TULUM - Individual
  UPDATE assets SET
    urls = '{
      "flipbook": "https://heyzine.com/flip-book/FS_FoT_Single.html",
      "pdf": "https://drive.google.com/drive/folders/1-bVMdJmI24LZUAXvJMu64rkNjmR-AWlR?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/flavors-of-tulum.png'
  WHERE property_id = prop_id AND name = 'Flavors of Tulum - Individual';

  -- RESORT MAP
  UPDATE assets SET
    urls = '{
      "flipbook_es": "https://heyzine.com/flip-book/ResortMapCunci.html",
      "pdf": "https://drive.google.com/file/d/1jWdIalMVd6JWY3r1Ukiw820ldzsoPvM8/view?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/resort-map.png'
  WHERE property_id = prop_id AND name = 'Resort Map';

  -- THEMED EVENTS
  UPDATE assets SET
    urls = '{
      "flipbook": "https://heyzine.com/flip-book/CUNCI_ThemedEvents.html",
      "pdf": "https://drive.google.com/file/d/10_rHwpSVrE7yCpO8_i0Ovgiec8JJ9v4G/view?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/themed-events.png'
  WHERE property_id = prop_id AND name = 'Themed Events - Spark Delight';

  -- FESTIVE PROGRAM 2025
  UPDATE assets SET
    urls = '{
      "flipbook": "https://heyzine.com/flip-book/FestiveProgram-Cunci.html",
      "pdf": "https://drive.google.com/file/d/1J-JGnYU4sdxHHFDRghA2EF_xidNl0sE1/view?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/festive-program.jpeg'
  WHERE property_id = prop_id AND name = 'Festive Program 2025';

  -- FIRSTVIEW VIRTUAL TOUR
  UPDATE assets SET
    urls = '{
      "tour_url": "https://conrad-tulum-riviera-maya.firstview.us/en",
      "diagramming": "https://conrad-tulum-riviera-maya.firstview.us/en"
    }'::jsonb,
    thumbnail_url = '/images/assets/marketing-tools.png'
  WHERE property_id = prop_id AND name = 'FirstView Virtual Tour';

  -- TRUETOUR
  UPDATE assets SET
    urls = '{
      "tour_url": "https://visitingmedia.com/tt8/?ttid=conrad-tulum-riviera-maya#/3d-model/1/1"
    }'::jsonb,
    thumbnail_url = '/images/assets/marketing-tools.png'
  WHERE property_id = prop_id AND name = 'TrueTour Experience';

  -- WEDDING PACKAGES 2025
  UPDATE assets SET
    urls = '{
      "flipbook_en": "https://heyzine.com/flip-book/brochureweddings2025Eng.html",
      "flipbook_es": "https://heyzine.com/flip-book/Brochureweddings2025Sp.html",
      "pdf": "https://drive.google.com/drive/folders/1KH9SdkUdBoJ0G9Ofalui2ty_Ob4HZIVy?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/wedding-2025.png'
  WHERE property_id = prop_id AND name = 'Wedding Packages 2025';

  -- WEDDING PACKAGES 2026
  UPDATE assets SET
    urls = '{
      "flipbook_en": "https://heyzine.com/flip-book/Brochureweddings2026Eng.html",
      "flipbook_es": "https://heyzine.com/flip-book/Brochureweddings2026Sp.html",
      "pdf": "https://drive.google.com/drive/folders/1_q3LmG_0EHu4S_rU5qw-sdb0Zm-Zy_4T?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/wedding-2026.png'
  WHERE property_id = prop_id AND name = 'Wedding Packages 2026';

  -- SPA MENU
  UPDATE assets SET
    urls = '{
      "flipbook_en": "https://heyzine.com/flip-book/Menu-Spa-Ing.html",
      "flipbook_es": "https://heyzine.com/flip-book/Menu-Spa-Esp.html",
      "pdf": "https://drive.google.com/drive/folders/1AspUzGfnacOaxV7nObXJMVO23uQYUtBQ?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/spa-menu.png'
  WHERE property_id = prop_id AND name = 'Spa Menu';

  -- SPA FACTSHEET
  UPDATE assets SET
    urls = '{
      "flipbook_en": "https://heyzine.com/flip-book/Fs-Spa-Eng.html",
      "flipbook_es": "https://heyzine.com/flip-book/Fs-spa-Sp.html",
      "pdf": "https://drive.google.com/drive/folders/1mfyeOVd4Bqr4FJ7r7257t3vsll_pX93Z?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/spa-factsheet.png'
  WHERE property_id = prop_id AND name = 'Spa Factsheet';

  -- EVENTS GALLERY - WEDDINGS
  UPDATE assets SET
    urls = '{
      "flipbook": "https://heyzine.com/flip-book/WeddingsGallery_CUNCI.html",
      "pdf": "https://drive.google.com/file/d/1XXEX5K8ZDhz2AKT7g16JNqTb_CtzI8Z3/view?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/weddings-gallery.jpeg'
  WHERE property_id = prop_id AND name = 'Events Gallery - Weddings';

  -- EVENTS GALLERY - GROUPS
  UPDATE assets SET
    urls = '{
      "flipbook": "https://heyzine.com/flip-book/HotelEventsGallery_CUNCI.html",
      "pdf": "https://drive.google.com/file/d/1OSTtT8FeCbcaDk0ukcohGcYjCkWTcBel/view?usp=drive_link"
    }'::jsonb,
    thumbnail_url = '/images/assets/groups-gallery.png'
  WHERE property_id = prop_id AND name = 'Events Gallery - Groups';

  -- =====================================================
  -- ADD/UPDATE HOTEL ASSETS (Images, Videos, Logos)
  -- =====================================================

  -- HOTEL IMAGE LIBRARY
  UPDATE assets SET
    urls = '{
      "drive_folder": "https://drive.google.com/drive/folders/1VThV7QgZITVg3nGq7aiDQIcsfRUzV1Ix"
    }'::jsonb
  WHERE property_id = prop_id AND name = 'Hotel Image Library';

  -- Update or insert if doesn't exist
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order)
  VALUES (
    prop_id,
    'Hotel Image Library',
    'image',
    'marketing',
    'en',
    '{"drive_folder": "https://drive.google.com/drive/folders/1VThV7QgZITVg3nGq7aiDQIcsfRUzV1Ix"}',
    '/images/assets/hotel-assets.png',
    ARRAY['images', 'photography', 'marketing'],
    'High-resolution professional photography of resort facilities, rooms, and amenities.',
    30
  ) ON CONFLICT DO NOTHING;

  -- BRAND LOGOS
  UPDATE assets SET
    urls = '{
      "drive_folder": "https://drive.google.com/drive/folders/1uZ47Pb2wBt6YHfvFoIVDfWHAx3Gp_dl-"
    }'::jsonb
  WHERE property_id = prop_id AND name = 'Brand Logos & Assets';

  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order)
  VALUES (
    prop_id,
    'Brand Logos & Assets',
    'image',
    'marketing',
    'en',
    '{"drive_folder": "https://drive.google.com/drive/folders/1uZ47Pb2wBt6YHfvFoIVDfWHAx3Gp_dl-"}',
    '/images/assets/conrad-logo.png',
    ARRAY['logos', 'branding', 'identity'],
    'Official Conrad Tulum logos in various formats for marketing materials.',
    31
  ) ON CONFLICT DO NOTHING;

  -- VIDEO LIBRARY
  UPDATE assets SET
    urls = '{
      "drive_folder": "https://drive.google.com/drive/folders/1HrNRmQCj0E7s39d5DFmeco4NDnb1ohts",
      "youtube": "https://www.youtube.com/watch?v=XFCculW6XKI"
    }'::jsonb
  WHERE property_id = prop_id AND name = 'Promotional Videos';

  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order)
  VALUES (
    prop_id,
    'Promotional Videos',
    'video',
    'marketing',
    'both',
    '{"drive_folder": "https://drive.google.com/drive/folders/1HrNRmQCj0E7s39d5DFmeco4NDnb1ohts", "youtube": "https://www.youtube.com/watch?v=XFCculW6XKI"}',
    '/images/assets/hotel-assets.png',
    ARRAY['video', 'promotional', 'marketing'],
    'Professional video content showcasing the Conrad Tulum experience.',
    32
  ) ON CONFLICT DO NOTHING;

  -- MEDIA/PRESS
  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order)
  VALUES (
    prop_id,
    'Press & Media Coverage',
    'pdf',
    'marketing',
    'en',
    '{"hilton_stories": "https://stories.hilton.com/releases/conrad-tulum-riviera-maya-ushers-in-era-of-luxury"}',
    '/images/assets/hotel-assets.png',
    ARRAY['press', 'media', 'news', 'coverage'],
    'Press releases and media coverage about Conrad Tulum Riviera Maya.',
    33
  ) ON CONFLICT DO NOTHING;

  -- DIGITAL BOOKSHELVES
  UPDATE assets SET
    urls = '{
      "mice_bookshelf": "https://heyzine.com/shelf/MICEmaterialscunci.html",
      "flavors_bookshelf": "https://heyzine.com/shelf/Flavors-of-tulum-cunci.html"
    }'::jsonb
  WHERE property_id = prop_id AND name = 'Digital Bookshelves';

  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order)
  VALUES (
    prop_id,
    'Digital Bookshelves',
    'flipbook',
    'marketing',
    'both',
    '{"mice_bookshelf": "https://heyzine.com/shelf/MICEmaterialscunci.html", "flavors_bookshelf": "https://heyzine.com/shelf/Flavors-of-tulum-cunci.html"}',
    '/images/assets/bookshelves.png',
    ARRAY['bookshelves', 'flipbooks', 'library'],
    'Complete digital library of all Conrad Tulum flipbooks and materials.',
    34
  ) ON CONFLICT DO NOTHING;

  -- DOWNLOAD ALL
  UPDATE assets SET
    urls = '{
      "drive_link": "https://drive.google.com/drive/folders/1vs4lVb4SoMwukNKaX7ebwehvxIdeQkkd?usp=drive_link"
    }'::jsonb
  WHERE property_id = prop_id AND name = 'Complete Asset Download';

  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order)
  VALUES (
    prop_id,
    'Complete Asset Download',
    'pdf',
    'sales',
    'both',
    '{"drive_link": "https://drive.google.com/drive/folders/1vs4lVb4SoMwukNKaX7ebwehvxIdeQkkd?usp=drive_link"}',
    '/images/assets/factsheet.png',
    ARRAY['download', 'complete', 'all-assets'],
    'One-click access to download all Conrad Tulum sales and marketing materials.',
    35
  ) ON CONFLICT DO NOTHING;

  -- FIRSTVIEW DIAGRAMMING
  UPDATE assets SET
    urls = '{
      "firstview_diagram_url": "https://conrad-tulum-riviera-maya.firstview.us/en"
    }'::jsonb
  WHERE property_id = prop_id AND name = 'FirstView Diagramming Tool';

  INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order)
  VALUES (
    prop_id,
    'FirstView Diagramming Tool',
    'diagram',
    'marketing',
    'en',
    '{"firstview_diagram_url": "https://conrad-tulum-riviera-maya.firstview.us/en"}',
    '/images/assets/marketing-tools.png',
    ARRAY['firstview', 'diagramming', 'floorplan', 'events'],
    'Interactive diagramming tool for event space planning and layouts.',
    36
  ) ON CONFLICT DO NOTHING;

  -- =====================================================
  -- UPDATE PROPERTY WITH SOCIAL MEDIA & CONTACT INFO
  -- =====================================================

  UPDATE properties
  SET
    location = jsonb_set(
      location,
      '{social_media}',
      '{
        "facebook": "https://www.facebook.com/ConradTulumRivieraMaya/",
        "instagram": "https://www.instagram.com/conradtulumrivieramaya/",
        "linkedin": "https://www.linkedin.com/company/conrad-tulum-riviera-maya1/",
        "youtube": "https://www.youtube.com/watch?v=XFCculW6XKI",
        "website": "https://conradtulumrivieramaya.com/",
        "hilton": "https://www.hilton.com/en/hotels/cuncici-conrad-tulum-riviera-maya/"
      }'::jsonb
    )
  WHERE slug = 'conrad-tulum';

  UPDATE properties
  SET
    location = jsonb_set(
      location,
      '{marketing_contacts}',
      '[
        {"name": "Irais Salinas", "email": "Irais.Salinas@Hilton.com", "role": "Marketing"},
        {"name": "Cici Velazquez", "email": "Cicialli.Velazquez@Hilton.com", "role": "Marketing"},
        {"name": "Valeria Aquino", "email": "Valeria.Aquino@ConradHotels.com", "role": "Marketing"},
        {"name": "Karina Sierra", "email": "Karina.Sierra@Hilton.com", "role": "Marketing"}
      ]'::jsonb
    )
  WHERE slug = 'conrad-tulum';

END $$;

-- Verify the updates
SELECT name, urls FROM assets WHERE urls::text NOT LIKE '%"#"%' LIMIT 5;
