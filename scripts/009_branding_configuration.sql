-- Migration: Add branding configuration to properties table
-- This extends the properties table to store all branding settings

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{
  "property": {
    "name": "Conrad Tulum Riviera Maya",
    "shortName": "Conrad Tulum",
    "tagline": "Crafted Experiences",
    "destination": "Caribbean''s most extraordinary destinations",
    "description": "Your personalized guide to planning unforgettable group experiences at one of the Caribbean''s most extraordinary destinations."
  },
  "images": {
    "welcomeBackground": "https://media.cntraveler.com/photos/6245d3ef538c15fb628ae3cb/16:9/w_2240,c_limit/Conrad%20Tulum_%C2%A9Victor%20Elias_Lobby%20(3).jpg",
    "loginBackground": "https://media.cntraveler.com/photos/6245d3ef538c15fb628ae3cb/16:9/w_2240,c_limit/Conrad%20Tulum_%C2%A9Victor%20Elias_Lobby%20(3).jpg",
    "loginBackgroundVideo": "/api/media/home-video",
    "signUpBackground": "/luxury-resort-ocean-view-sunset-conrad-tulum-aeria.jpg",
    "visitHeroDefault": "/luxury-resort-ocean-view-sunset-conrad-tulum-aeria.jpg",
    "favicon": "/icon.svg",
    "appleTouchIcon": "/apple-icon.png",
    "resortMap": "/images/assets/resort-map.png",
    "aerialView": "/luxury-resort-ocean-view-sunset-conrad-tulum-aeria.jpg",
    "placeholder": "/images/conrad/p01_img01_xref250.png"
  },
  "typography": {
    "fontFamily": {
      "sans": "var(--font-geist-sans)",
      "serif": "var(--font-serif)",
      "mono": "var(--font-geist-mono)"
    }
  },
  "contact": {
    "salesEmail": "sales@conradtulum.com",
    "phone": "+52 984 123 4567"
  },
  "social": {
    "website": "https://www.hilton.com/en/hotels/tqrcici-conrad-tulum-riviera-maya/"
  }
}';

-- Update brand_colors to match the branding config structure
UPDATE properties
SET brand_colors = jsonb_set(
  COALESCE(brand_colors, '{}'::jsonb),
  '{themeColor}',
  to_jsonb(COALESCE(brand_colors->>'primary', '#C4A052'))
)
WHERE brand_colors IS NOT NULL;

-- Create index for faster branding config lookups
CREATE INDEX IF NOT EXISTS idx_properties_branding_config ON properties USING gin(branding_config);

COMMENT ON COLUMN properties.branding_config IS 'Complete branding configuration including property info, images, typography, contact, and social media';
