-- Migration 007: Add virtual tour assets for meeting rooms

DO $$
DECLARE
  prop_id UUID;
  collection_id UUID;
  spazious_id UUID;
  firstview_id UUID;
BEGIN
  -- Get property ID
  SELECT id INTO prop_id FROM properties WHERE slug = 'conrad-tulum';
  IF prop_id IS NULL THEN
    RAISE EXCEPTION 'Property conrad-tulum not found';
  END IF;

  -- Ensure collection exists
  SELECT id INTO collection_id FROM collections WHERE property_id = prop_id AND name = 'Virtual Tours & Meeting Rooms' LIMIT 1;
  IF collection_id IS NULL THEN
    INSERT INTO collections (property_id, name, description, cover_image_url, sort_order)
    VALUES (
      prop_id,
      'Virtual Tours & Meeting Rooms',
      'Interactive virtual tours for meeting spaces and ballrooms.',
      'https://media.cntraveler.com/photos/6245d3ef538c15fb628ae3cb/16:9/w_2240,c_limit/Conrad%20Tulum_%C2%A9Victor%20Elias_Lobby%20(3).jpg',
      7
    )
    RETURNING id INTO collection_id;
  END IF;

  -- Insert or fetch Spazious overview tour
  SELECT id INTO spazious_id FROM assets WHERE property_id = prop_id AND name = 'Meeting Rooms Virtual Tour (Spazious)' LIMIT 1;
  IF spazious_id IS NULL THEN
    INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order)
    VALUES (
      prop_id,
      'Meeting Rooms Virtual Tour (Spazious)',
      'link',
      'sales',
      'en',
      '{"link": "https://hilton-hotels-and-resorts.spazious.com/conrad-hotels-and-resorts/mexico/tulum/conrad-tulum-riviera-maya/meeting-room/overview"}',
      'https://media.cntraveler.com/photos/6245d3ef538c15fb628ae3cb/16:9/w_2240,c_limit/Conrad%20Tulum_%C2%A9Victor%20Elias_Lobby%20(3).jpg',
      ARRAY['virtual-tour', 'meeting-rooms', 'collections'],
      'Spazious interactive overview of Conrad Tulum meeting rooms.',
      1
    )
    RETURNING id INTO spazious_id;
  END IF;

  -- Insert or fetch FirstView ballroom tour
  SELECT id INTO firstview_id FROM assets WHERE property_id = prop_id AND name = 'Conrad Ballroom Virtual Tour (FirstView)' LIMIT 1;
  IF firstview_id IS NULL THEN
    INSERT INTO assets (property_id, name, asset_type, category, language, urls, thumbnail_url, tags, description, sort_order)
    VALUES (
      prop_id,
      'Conrad Ballroom Virtual Tour (FirstView)',
      'link',
      'sales',
      'en',
      '{"link": "https://conrad-tulum-riviera-maya.firstview.us/en/conrad-ballroom"}',
      'https://media.cntraveler.com/photos/6245d3ef538c15fb628ae3cb/16:9/w_2240,c_limit/Conrad%20Tulum_%C2%A9Victor%20Elias_Lobby%20(3).jpg',
      ARRAY['virtual-tour', 'ballroom', 'meeting-rooms', 'collections'],
      'FirstView interactive tour for Conrad Ballroom.',
      2
    )
    RETURNING id INTO firstview_id;
  END IF;

  -- Attach assets to collection
  UPDATE collections
  SET asset_ids = ARRAY[spazious_id, firstview_id],
      cover_image_url = 'https://media.cntraveler.com/photos/6245d3ef538c15fb628ae3cb/16:9/w_2240,c_limit/Conrad%20Tulum_%C2%A9Victor%20Elias_Lobby%20(3).jpg',
      description = 'Interactive virtual tours for meeting spaces and ballrooms.'
  WHERE id = collection_id;

  RAISE NOTICE 'Virtual tours collection updated: %', collection_id;
END $$;
