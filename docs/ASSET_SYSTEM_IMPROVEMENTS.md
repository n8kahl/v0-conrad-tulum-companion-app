# Asset Display System Improvements

**Date**: December 2024  
**Phase**: Asset Management & Site Visit Builder Modernization

## Overview

Comprehensive upgrade to asset display and site visit builder systems, transforming simplistic link-based displays into rich visual experiences with smart recommendations and live preview capabilities.

## 1. AssetCard Component

**File**: `components/public/asset-card.tsx`

### Features

- **Rich Visual Display**: Thumbnail images with fallback icons for all asset types
- **Asset Type Icons**: Lucide icons mapped to each asset type (PDF, Video, Virtual Tour, etc.)
- **Smart Badges**:
  - Featured assets (tag:featured) → Amber "Featured" badge
  - Popular assets (tag:popular) → "Popular" badge
  - Video assets → Play button overlay
  - Virtual tours → "360° Tour" badge
- **Variants**: Default (full card with description) and Compact (minimal for carousels)
- **Primary URL Logic**: Intelligent fallback chain (pdf_en → pdf_es → pdf → flipbook_en → flipbook_es → flipbook → firstview → tour_url)
- **Metadata Display**: "Category · Type" formatting

### Usage

```tsx
import { AssetCard } from "@/components/public/asset-card"

<AssetCard asset={asset} variant="default" />
<AssetCard asset={asset} variant="compact" />
```

### Integrations

Updated all asset displays to use AssetCard:

- ✅ `/explore/assets` - Asset grid view
- ✅ `/explore/assets/[id]` - Collection carousel
- ✅ `/explore/search` - Search results grid

## 2. Asset Bundle System

**Files**:

- `lib/assets/asset-queries.ts` - Smart query functions
- `components/public/asset-bundle-strip.tsx` - UI component

### Query Functions

#### `fetchAssetBundle(filter: AssetBundleFilter): Promise<AssetBundle>`

Fetches curated asset bundles based on contextual filters:

```typescript
interface AssetBundleFilter {
  propertyId: string;
  audience?:
    | "event_planner"
    | "wedding_planner"
    | "corporate"
    | "leisure"
    | "spa";
  sectionSlug?: string; // e.g., "meetings-spaces", "dining"
  groupType?: "featured" | "popular" | "comprehensive" | "quick-reference";
  category?: string;
  assetType?: string;
  limit?: number;
}
```

**Priority Sorting**:

1. Featured assets (tag:featured)
2. Popular assets (tag:popular or high view_count)
3. Manual sort_order
4. Recently updated

**Example Usage**:

```typescript
// Get meeting planning assets for corporate clients
const bundle = await fetchAssetBundle({
  propertyId: "conrad-tulum",
  audience: "corporate",
  sectionSlug: "meetings-spaces",
  groupType: "featured",
  limit: 6,
});
```

#### `fetchAssetBundles(filters[]): Promise<AssetBundle[]>`

Fetch multiple bundles in parallel for multi-section layouts.

#### `getSuggestedAssetsForVenue(venueId, propertyId, limit): Promise<Asset[]>`

Returns assets tagged with venue category/type. Useful for contextual recommendations.

### AssetBundleStrip Component

Horizontal scrollable strip with:

- Section title and view all link
- Compact asset cards
- Snap scroll behavior
- Empty state handling
- Loading skeleton

**Usage**:

```tsx
import { AssetBundleStrip } from "@/components/public/asset-bundle-strip";

<AssetBundleStrip
  title="Meeting & Event Resources"
  description="Featured materials for event planners"
  assets={assets}
  viewAllHref="/explore/assets?category=meetings"
/>;
```

## 3. Site Visit Builder Modernization

**Files**:

- `components/admin/site-visit-detail.tsx` - Updated component
- `app/admin/visits/[id]/page.tsx` - Updated query

### Major Changes

#### 3-Panel Layout

- **Left Panel**: Client details and metadata
- **Center Panel**: Tour route builder with agenda items
- **Right Panel**: Live client view preview (toggleable)

Layout adapts based on preview state:

- Preview hidden: 3-column grid (details | tour route | sidebar)
- Preview shown: 2-column grid (tour route | preview)

#### Venue Stop Cards Enhanced

**Before**: Basic venue name + type  
**After**: Rich cards with:

- **Venue Thumbnail**: Hero image from `venue_media` (16x16 ratio)
- **Capacity Chips**: First 3 capacity setups as badges (e.g., "theater: 200")
- **Reorder Controls**: Up/down arrows for stop sequencing
- **Favorite Star**: Visual indicator for client favorites
- **Scheduled Time**: Time picker per stop
- **Expanded Details**:
  - Sales notes (textarea for proposal content)
  - Client reaction/feedback (textarea for questions/comments)
  - Captured media display (shows photos captured during tour)

**Captured Media Section**:

- No more URL input field
- Displays photos captured via mobile app
- Shows placeholder when no media captured

#### Live Preview Panel

Sticky sidebar showing real-time client view:

- Visit header (company, event type, date, attendees)
- Tour route as client sees it
- Stop cards with thumbnails (smaller, 12x12 ratio)
- Scheduled times and favorite indicators
- Responsive to all changes made in builder

Toggle preview with "Show/Hide Preview" button in header.

### Database Queries

Updated queries to include `venue_media` relations:

```typescript
// Venues with media
supabase.from("venues").select("*, venue_media(*, media:media_library(*))");

// Visit stops with venue media
supabase
  .from("visit_stops")
  .select("*, venue:venues(*, venue_media(*, media:media_library(*)))");
```

### Helper Functions

```typescript
// Get venue hero image from venue_media relations
function getVenueHeroImage(venue): string | null;

// Get specific capacity from venue capacities JSONB
function getVenueCapacity(venue, setupType): number | null;
```

## Technical Patterns

### Server vs Client Components

- **AssetCard**: Client component (uses onClick handlers)
- **AssetBundleStrip**: Client component (uses interactivity)
- **SiteVisitDetail**: Client component (complex state management)
- **Asset queries**: Server-side functions (uses server Supabase client)

### Image Optimization

All thumbnails use Next.js `<Image>` component with:

- `fill` layout for responsive sizing
- `object-cover` for consistent aspect ratios
- Fallback icons when no image available

### TypeScript Types

All components use proper TypeScript interfaces:

- Exported types from `lib/supabase/types.ts`
- Extended types with media relations (e.g., `Venue & { venue_media?: ... }`)
- Explicit function return types

## Migration Checklist

When using these new components:

1. ✅ Replace manual asset card rendering with `<AssetCard>`
2. ✅ Update queries to include `venue_media` relations where thumbnails needed
3. ✅ Use `fetchAssetBundle()` instead of raw Supabase queries for curated lists
4. ✅ Implement `AssetBundleStrip` for horizontal resource sections
5. ✅ Add appropriate `featured` and `popular` tags to assets in database

## Future Enhancements

### Phase 4 Candidates

- **Asset Analytics**: Track views, downloads, and engagement per asset
- **Smart Recommendations**: ML-based suggestions based on venue/event type
- **Asset Versioning**: Track revisions of PDFs and flipbooks
- **Bulk Asset Operations**: Multi-select for tagging, moving, deleting
- **Asset Templates**: Pre-built bundles for common scenarios

### Site Visit Builder

- **Drag-and-drop reordering**: Replace up/down arrows with drag handles
- **Venue search**: Filter venues by type, capacity, tags in dropdown
- **Time suggestions**: Auto-suggest tour times based on venue locations
- **Resource recommendations**: Show suggested assets per stop in builder
- **Export to PDF**: Generate printable agenda with thumbnails

## Files Changed

### New Files

- `components/public/asset-card.tsx` (167 lines)
- `lib/assets/asset-queries.ts` (323 lines)
- `components/public/asset-bundle-strip.tsx` (162 lines)
- `docs/ASSET_SYSTEM_IMPROVEMENTS.md` (this file)

### Modified Files

- `components/admin/site-visit-detail.tsx` (640 lines, +95 lines)
- `app/admin/visits/[id]/page.tsx` (updated queries)
- `app/explore/assets/asset-grid.tsx` (simplified rendering)
- `components/public/asset-carousel.tsx` (simplified to use AssetCard)
- `app/explore/search/search-results.tsx` (simplified rendering)

### Total Lines Added

~900 lines of new code across 8 files

## Testing

All changes pass TypeScript compilation with no errors:

- ✅ `components/admin/site-visit-detail.tsx`
- ✅ `app/admin/visits/[id]/page.tsx`
- ✅ `components/public/asset-card.tsx`
- ✅ `components/public/asset-bundle-strip.tsx`
- ✅ `lib/assets/asset-queries.ts`
- ✅ `app/explore/assets/asset-grid.tsx`
- ✅ `app/explore/search/search-results.tsx`

**Next Steps**: Deploy to Railway and test in production with real data.
