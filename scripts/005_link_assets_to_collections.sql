-- Migration 005: Link assets to collections and set cover images
-- This populates the asset_ids array in collections with actual asset UUIDs

DO $$
DECLARE
  prop_id UUID;
  -- Collection IDs
  meetings_col_id UUID;
  retreats_col_id UUID;
  weddings_col_id UUID;
  wellness_col_id UUID;
  flavors_col_id UUID;
  marketing_col_id UUID;
  -- Asset IDs
  factsheet_id UUID;
  groups_id UUID;
  gate_to_gate_id UUID;
  transportation_id UUID;
  ceiba_id UUID;
  flavors_id UUID;
  themed_events_id UUID;
  festive_id UUID;
  resort_map_id UUID;
  spa_factsheet_id UUID;
  spa_menu_id UUID;
  wedding_2025_id UUID;
  wedding_2026_id UUID;
  wedding_gallery_id UUID;
  groups_gallery_id UUID;
  hotel_assets_id UUID;
  bookshelves_id UUID;
  marketing_tools_id UUID;
BEGIN
  -- Get property ID
  SELECT id INTO prop_id FROM properties WHERE slug = 'conrad-tulum';

  -- =====================================================
  -- First, consolidate collections (remove duplicates)
  -- Keep only one of each type, delete extras
  -- =====================================================

  -- Keep first Meetings & Incentives, delete rest
  DELETE FROM collections
  WHERE property_id = prop_id
    AND name = 'Meetings & Incentives'
    AND id NOT IN (SELECT id FROM collections WHERE property_id = prop_id AND name = 'Meetings & Incentives' ORDER BY created_at LIMIT 1);

  DELETE FROM collections
  WHERE property_id = prop_id
    AND name = 'Executive Retreats'
    AND id NOT IN (SELECT id FROM collections WHERE property_id = prop_id AND name = 'Executive Retreats' ORDER BY created_at LIMIT 1);

  DELETE FROM collections
  WHERE property_id = prop_id
    AND name = 'Weddings & Celebrations'
    AND id NOT IN (SELECT id FROM collections WHERE property_id = prop_id AND name = 'Weddings & Celebrations' ORDER BY created_at LIMIT 1);

  DELETE FROM collections
  WHERE property_id = prop_id
    AND name = 'Wellness Experiences'
    AND id NOT IN (SELECT id FROM collections WHERE property_id = prop_id AND name = 'Wellness Experiences' ORDER BY created_at LIMIT 1);

  DELETE FROM collections
  WHERE property_id = prop_id
    AND name = 'Flavors of Tulum'
    AND id NOT IN (SELECT id FROM collections WHERE property_id = prop_id AND name = 'Flavors of Tulum' ORDER BY created_at LIMIT 1);

  DELETE FROM collections
  WHERE property_id = prop_id
    AND name = 'Marketing Tools'
    AND id NOT IN (SELECT id FROM collections WHERE property_id = prop_id AND name = 'Marketing Tools' ORDER BY created_at LIMIT 1);

  -- =====================================================
  -- Get final collection IDs
  -- =====================================================
  SELECT id INTO meetings_col_id FROM collections WHERE property_id = prop_id AND name = 'Meetings & Incentives' LIMIT 1;
  SELECT id INTO retreats_col_id FROM collections WHERE property_id = prop_id AND name = 'Executive Retreats' LIMIT 1;
  SELECT id INTO weddings_col_id FROM collections WHERE property_id = prop_id AND name = 'Weddings & Celebrations' LIMIT 1;
  SELECT id INTO wellness_col_id FROM collections WHERE property_id = prop_id AND name = 'Wellness Experiences' LIMIT 1;
  SELECT id INTO flavors_col_id FROM collections WHERE property_id = prop_id AND name = 'Flavors of Tulum' LIMIT 1;
  SELECT id INTO marketing_col_id FROM collections WHERE property_id = prop_id AND name = 'Marketing Tools' LIMIT 1;

  -- =====================================================
  -- Get asset IDs
  -- =====================================================
  SELECT id INTO factsheet_id FROM assets WHERE property_id = prop_id AND name = 'Hotel Factsheet' LIMIT 1;
  SELECT id INTO groups_id FROM assets WHERE property_id = prop_id AND name = 'Groups Overview' LIMIT 1;
  SELECT id INTO gate_to_gate_id FROM assets WHERE property_id = prop_id AND name = 'Gate to Gate Journey' LIMIT 1;
  SELECT id INTO transportation_id FROM assets WHERE property_id = prop_id AND name = 'Transportation Guide' LIMIT 1;
  SELECT id INTO ceiba_id FROM assets WHERE property_id = prop_id AND name = 'Ceiba Club Factsheet' LIMIT 1;
  SELECT id INTO flavors_id FROM assets WHERE property_id = prop_id AND name = 'Flavors of Tulum' LIMIT 1;
  SELECT id INTO themed_events_id FROM assets WHERE property_id = prop_id AND name = 'Themed Events' LIMIT 1;
  SELECT id INTO festive_id FROM assets WHERE property_id = prop_id AND name = 'Festive Program 2025' LIMIT 1;
  SELECT id INTO resort_map_id FROM assets WHERE property_id = prop_id AND name = 'Resort Map' LIMIT 1;
  SELECT id INTO spa_factsheet_id FROM assets WHERE property_id = prop_id AND name = 'Spa Factsheet' LIMIT 1;
  SELECT id INTO spa_menu_id FROM assets WHERE property_id = prop_id AND name = 'Spa Menu' LIMIT 1;
  SELECT id INTO wedding_2025_id FROM assets WHERE property_id = prop_id AND name = 'Wedding Packages 2025' LIMIT 1;
  SELECT id INTO wedding_2026_id FROM assets WHERE property_id = prop_id AND name = 'Wedding Packages 2026' LIMIT 1;
  SELECT id INTO wedding_gallery_id FROM assets WHERE property_id = prop_id AND name = 'Wedding Events Gallery' LIMIT 1;
  SELECT id INTO groups_gallery_id FROM assets WHERE property_id = prop_id AND name = 'Group Events Gallery' LIMIT 1;
  SELECT id INTO hotel_assets_id FROM assets WHERE property_id = prop_id AND name = 'Hotel Image Library' LIMIT 1;
  SELECT id INTO bookshelves_id FROM assets WHERE property_id = prop_id AND name = 'Digital Bookshelves' LIMIT 1;
  SELECT id INTO marketing_tools_id FROM assets WHERE property_id = prop_id AND name = 'TrueTour Virtual Experience' LIMIT 1;

  -- =====================================================
  -- Link assets to collections and set cover images
  -- =====================================================

  -- Meetings & Incentives: Core sales materials
  UPDATE collections SET
    asset_ids = ARRAY[factsheet_id, groups_id, gate_to_gate_id, transportation_id, resort_map_id, themed_events_id, festive_id, groups_gallery_id],
    cover_image_url = '/images/assets/factsheet.png',
    description = 'Core sales materials for meetings, conferences, and incentive groups. Includes factsheets, transportation guides, and event resources.',
    sort_order = 1
  WHERE id = meetings_col_id;

  -- Executive Retreats: Exclusive experiences
  UPDATE collections SET
    asset_ids = ARRAY[ceiba_id, factsheet_id, gate_to_gate_id],
    cover_image_url = '/images/assets/ceiba-club.png',
    description = 'Exclusive Ceiba Club amenities and premium experiences for executive groups and VIP retreats.',
    sort_order = 2
  WHERE id = retreats_col_id;

  -- Weddings & Celebrations
  UPDATE collections SET
    asset_ids = ARRAY[wedding_2025_id, wedding_2026_id, wedding_gallery_id],
    cover_image_url = '/images/assets/wedding-2025.png',
    description = 'Complete wedding packages and inspiration for destination celebrations at Conrad Tulum.',
    sort_order = 3
  WHERE id = weddings_col_id;

  -- Wellness Experiences
  UPDATE collections SET
    asset_ids = ARRAY[spa_factsheet_id, spa_menu_id],
    cover_image_url = '/images/assets/spa-factsheet.png',
    description = 'Spa services, wellness programs, and rejuvenating experiences for groups.',
    sort_order = 4
  WHERE id = wellness_col_id;

  -- Flavors of Tulum
  UPDATE collections SET
    asset_ids = ARRAY[flavors_id],
    cover_image_url = '/images/assets/flavors-of-tulum.png',
    description = 'Culinary experiences featuring local cuisine and authentic Mayan flavors.',
    sort_order = 5
  WHERE id = flavors_col_id;

  -- Marketing Tools
  UPDATE collections SET
    asset_ids = ARRAY[hotel_assets_id, bookshelves_id, marketing_tools_id],
    cover_image_url = '/images/assets/marketing-tools.png',
    description = 'Digital assets, virtual tours, and marketing materials for presentations.',
    sort_order = 6
  WHERE id = marketing_col_id;

  -- Log what was done
  RAISE NOTICE 'Collections updated:';
  RAISE NOTICE 'Meetings & Incentives: %', meetings_col_id;
  RAISE NOTICE 'Executive Retreats: %', retreats_col_id;
  RAISE NOTICE 'Weddings: %', weddings_col_id;
  RAISE NOTICE 'Wellness: %', wellness_col_id;
  RAISE NOTICE 'Flavors: %', flavors_col_id;
  RAISE NOTICE 'Marketing: %', marketing_col_id;

END $$;

-- Remove any NULL values from asset_ids arrays (in case some assets weren't found)
UPDATE collections
SET asset_ids = ARRAY(SELECT x FROM unnest(asset_ids) AS x WHERE x IS NOT NULL)
WHERE asset_ids IS NOT NULL;
