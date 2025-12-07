# Branding Management System

## Overview

The branding management system allows you to customize all branding elements through the admin settings page, eliminating the need to edit code files directly.

## Features

### Configurable Elements

**Property Information:**
- Full property name
- Short name (for headers/mobile)
- Tagline
- Destination description
- Full description

**Brand Colors:**
- Primary color (buttons, accents)
- Secondary color (text, backgrounds)
- Theme color (mobile browser bar)
- Live color picker with hex input
- Color preview

**Images:**
- Welcome screen background
- Login page background & video
- Sign-up page background
- Visit hero default image
- Resort map (optional)
- Aerial view (optional)
- Placeholder image
- Logo images (optional)

**Contact Information:**
- Sales email
- Phone number
- Physical address

**Social Media:**
- Website URL
- Instagram URL
- Facebook URL

## How to Use

### Accessing Branding Settings

1. Log in to the admin panel at `/admin`
2. Navigate to **Settings** from the sidebar
3. Scroll to the **Branding Configuration** section
4. Use the tabs to access different branding categories

### Making Changes

1. **Edit Fields**: Modify any field in the branding form
2. **Save Changes**: Click the "Save Changes" button when done
3. **Reset**: Use the "Reset" button to discard unsaved changes
4. **Refresh**: After saving colors, refresh the page to see updates

### Database Storage

All branding configurations are stored in the `properties` table:

```sql
-- Branding config column structure
properties.branding_config JSONB
properties.brand_colors JSONB
```

Run the migration script to add branding support:

```bash
# In Supabase Studio SQL Editor
# Run: scripts/009_branding_configuration.sql
```

## API Endpoints

### GET /api/branding

Retrieves current branding configuration.

**Response:**
```json
{
  "property": {
    "name": "Conrad Tulum Riviera Maya",
    "shortName": "Conrad Tulum",
    "tagline": "Crafted Experiences",
    "destination": "Caribbean's most extraordinary destinations",
    "description": "..."
  },
  "colors": {
    "primary": "#C4A052",
    "secondary": "#2D2D2D",
    "themeColor": "#C4A052"
  },
  "images": { ... },
  "contact": { ... },
  "social": { ... }
}
```

### POST /api/branding

Updates branding configuration (requires authentication).

**Request Body:**
```json
{
  "branding_config": { ... },
  "brand_colors": { ... }
}
```

## Component Integration

The branding settings component is located at:
```
components/admin/branding-settings.tsx
```

It's integrated into the settings page:
```
app/admin/settings/page.tsx
```

## Technical Details

### State Management

- Local state for form values
- Change tracking to enable/disable save button
- Optimistic updates on successful save

### Validation

- URL validation for image paths
- Email validation for contact email
- Color hex code validation

### TypeScript

Full TypeScript support with the `BrandingConfig` interface:

```typescript
import type { BrandingConfig } from "@/lib/branding/config"
```

## Migration from Static Config

If you previously used the static config in `lib/branding/config.ts`:

1. Run migration script `009_branding_configuration.sql`
2. Access Settings > Branding Configuration
3. Verify all values are correct
4. Save to database
5. The static config remains as fallback

## Troubleshooting

### Changes Not Appearing

- **Colors**: Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+R)
- **Images**: Check browser cache, may need to clear
- **Text**: Should appear immediately after page reload

### Database Not Updating

- Check authentication (must be logged in as admin)
- Check browser console for API errors
- Verify migration script was run successfully

### Missing Fields

- Ensure migration script `009_branding_configuration.sql` was executed
- Check that `branding_config` column exists in `properties` table

## Future Enhancements

Planned features:
- [ ] Image upload directly from settings page
- [ ] Multi-property support (switch between properties)
- [ ] Preview mode to see changes before saving
- [ ] Import/export branding configurations
- [ ] Theme presets (dark mode, light mode, etc.)
- [ ] Advanced CSS customization interface
- [ ] Undo/redo functionality
- [ ] Change history/audit log

## Files Modified

- `app/api/branding/route.ts` - API endpoint for branding CRUD
- `components/admin/branding-settings.tsx` - Settings UI component
- `app/admin/settings/page.tsx` - Updated to include branding section
- `scripts/009_branding_configuration.sql` - Database migration
- `lib/branding/config.ts` - Added merge helper function

## Support

For issues or questions:
- Check the `docs/BRANDING_CONFIGURATION.md` for general branding info
- Review the TypeScript interface in `lib/branding/config.ts`
- Check the database schema in `scripts/009_branding_configuration.sql`
