# Branding Configuration Guide

## Overview

All branding elements (property name, colors, images, etc.) are now centralized in a single configuration file. This makes it easy to customize the application for different properties or rebrand without searching through multiple files.

## Configuration File

**Location**: `lib/branding/config.ts`

This file exports:

- `BrandingConfig` interface - TypeScript definition for all branding elements
- `brandingConfig` object - Current branding values (default: Conrad Tulum)
- `getBrandingConfig()` - Helper function to retrieve config
- `getPropertyName()` - Helper for formatted property names
- `getBrandColors()` - Helper for color values
- `getBrandImages()` - Helper for all image URLs

## Customization

### Changing Property Information

```typescript
property: {
  name: "Your Property Name",        // Full name
  shortName: "Your Property",        // Abbreviated name
  tagline: "Your Tagline",           // Hero tagline (line breaks on spaces)
  destination: "Your destination",    // Location description
  description: "Your description",    // Full description for meta tags
}
```

### Updating Colors

```typescript
colors: {
  primary: "#C4A052",      // Gold/accent color (buttons, highlights)
  secondary: "#2D2D2D",    // Dark color (text, backgrounds)
  themeColor: "#C4A052",   // Browser theme bar color
}
```

**Note**: After changing colors, also update `app/globals.css` for Tailwind CSS variables:

- `--primary` and related hsl values
- `--secondary` and related values

### Configuring Images

All images are specified as URLs (absolute or relative):

```typescript
images: {
  // Welcome/Home screen
  welcomeBackground: "url or path",
  welcomeBackgroundAlt: "optional fallback",

  // Auth pages
  loginBackground: "url or path",
  loginBackgroundVideo: "optional video path",
  signUpBackground: "url or path",

  // Visit pages
  visitHeroDefault: "url or path",

  // Headers/logos
  logoLight: "optional",
  logoDark: "optional",
  favicon: "/icon.svg",
  appleTouchIcon: "/apple-icon.png",

  // Property-specific
  resortMap: "optional path to resort map",
  aerialView: "optional aerial photo",

  // Fallback
  placeholder: "default image for missing content",
}
```

### Typography

Font families reference CSS variables defined in `app/layout.tsx`:

```typescript
typography: {
  fontFamily: {
    sans: "var(--font-geist-sans)",   // Body text
    serif: "var(--font-serif)",        // Headings, elegant text
    mono: "var(--font-geist-mono)",    // Code, monospace
  }
}
```

To change fonts:

1. Update font imports in `app/layout.tsx`
2. Update CSS variable names here
3. Rebuild the application

### Contact Information

```typescript
contact: {
  salesEmail: "sales@yourproperty.com",
  phone: "+1 234 567 8900",
  address: "Optional physical address",
}
```

### Social Media

```typescript
social: {
  website: "https://yourproperty.com",
  instagram: "https://instagram.com/yourproperty",
  facebook: "https://facebook.com/yourproperty",
}
```

## Usage in Components

### Importing

```typescript
import { getBrandingConfig } from "@/lib/branding/config";
```

### Client Components

```typescript
"use client";

export function MyComponent() {
  const branding = getBrandingConfig();

  return (
    <div>
      <h1>{branding.property.name}</h1>
      <img
        src={branding.images.welcomeBackground}
        alt={branding.property.name}
      />
      <p style={{ color: branding.colors.primary }}>
        {branding.property.description}
      </p>
    </div>
  );
}
```

### Server Components

```typescript
import { getBrandingConfig } from "@/lib/branding/config";

export default async function MyPage() {
  const branding = getBrandingConfig();

  return (
    <div>
      <h1>{branding.property.name}</h1>
      {/* ... */}
    </div>
  );
}
```

## Updated Components

The following components have been updated to use the branding configuration:

### Layout & Metadata

- `app/layout.tsx` - Page title, description, theme color, favicon

### Welcome & Auth

- `components/welcome-screen.tsx` - Hero background, property name, tagline, description
- `app/auth/login/page.tsx` - Background image/video, property name
- `app/auth/sign-up/page.tsx` - Background image, property name

### Visit Pages

- `app/visit/[token]/page.tsx` - Hero image, property name in header
- `app/explore/page.tsx` - Property name in hero

### Headers & Navigation

- `components/public/content-hub-header.tsx` - Logo text
- `components/admin/admin-header.tsx` - Logo text
- `components/admin/admin-sidebar.tsx` - Logo text and icon

### Specialty Components

- `components/map/resort-map.tsx` - Resort map image

## Image Best Practices

### File Locations

- Public images: `/public/images/` directory
- External CDN: Use full HTTPS URLs
- Supabase Storage: Use storage bucket URLs

### Recommended Sizes

- Welcome background: 2240x1260px (16:9, high quality)
- Auth backgrounds: 1920x1080px minimum
- Visit hero: 1920x800px (landscape)
- Resort map: 2000x1500px (detailed, zoomable)
- Logos: SVG format preferred for scalability

### Formats

- Photos: JPEG or WebP
- Graphics/logos: SVG or PNG with transparency
- Maps: High-resolution PNG

## Database Considerations

Property-level data is also stored in the `properties` table:

- Property name
- Location
- Description
- Time zone
- Currency

These database values are used for operational data (site visits, venues, etc.) while the branding config controls UI presentation. Keep them in sync or consider fetching branding dynamically from the database in the future.

## Future Enhancements

Potential improvements to the branding system:

1. **Multi-Property Support**: Load branding config dynamically based on subdomain or URL parameter
2. **Admin UI**: Create settings page to edit branding without code changes
3. **Theme Switching**: Support light/dark mode with different color schemes
4. **Localization**: Extend branding config to include translated property names and descriptions
5. **Asset Management**: Upload branding images through admin panel instead of file system

## Testing Your Changes

After updating the branding configuration:

1. Clear Next.js cache: `rm -rf .next`
2. Rebuild: `pnpm build`
3. Test all pages:
   - Welcome screen: `/`
   - Login: `/auth/login`
   - Sign up: `/auth/sign-up`
   - Explore: `/explore`
   - Admin: `/admin`
   - Visit (with valid token): `/visit/[token]`
4. Check mobile responsiveness
5. Verify all images load correctly
6. Test with browser theme detection

## Support

For questions or issues with branding configuration, refer to:

- TypeScript interface in `lib/branding/config.ts` for available options
- This documentation for usage patterns
- Existing component implementations for examples
