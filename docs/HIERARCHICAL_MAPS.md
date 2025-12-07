# Hierarchical Maps System

## Overview

The hierarchical maps system enables multi-level venue organization with dedicated maps at each level. Each venue can have its own map image showing pinned child venues, allowing for detailed property navigation from property-wide overview down to individual floor plans.

**Database Migration:** `scripts/010_hierarchical_maps.sql`

## Architecture

### Venue Hierarchy

```
Property (Root)
└── Building
    └── Floor
        ├── Space (meeting room, restaurant)
        └── Outdoor (pool, garden, terrace)
```

**Venue Types:**

- `property` - Top-level resort/hotel (e.g., "Conrad Tulum")
- `building` - Physical structures (e.g., "Main Building", "Spa Complex")
- `floor` - Levels within buildings (e.g., "Ground Floor", "2nd Floor")
- `space` - Indoor rooms (e.g., "Ballroom A", "Coral Restaurant")
- `outdoor` - Exterior venues (e.g., "Beach Area", "Pool Deck")

### Database Schema

**New Columns on `venues` table:**

```sql
map_image_url TEXT                    -- Direct URL to map image (optional)
map_image_media_id UUID               -- FK to media_library for managed uploads
parent_venue_id UUID                  -- Self-referencing FK for hierarchy
venue_type TEXT CHECK (IN (...))      -- Enum: property|building|floor|space|outdoor
location JSONB                        -- Extended with mapX/mapY percentages
```

**Location Object Structure:**

```typescript
{
  mapX: 45.5,    // % from left (0-100)
  mapY: 62.3,    // % from top (0-100)
  lat: 20.8871,  // GPS latitude (optional)
  lng: -87.0472, // GPS longitude (optional)
  building: "Main Building",  // Legacy text reference
  floor: "Ground Floor"       // Legacy text reference
}
```

**Recursive Functions:**

- `get_venue_path(venue_id UUID)` - Returns breadcrumb array from root to venue
- `get_child_venues(venue_id UUID)` - Returns immediate children of a venue

### Coordinate System

Venue pins use **percentage-based positioning** relative to map image dimensions:

- **mapX**: Distance from left edge (0% = far left, 100% = far right)
- **mapY**: Distance from top edge (0% = top, 100% = bottom)

This ensures pins scale responsively across different screen sizes while maintaining relative positions.

## Components

### MapPinEditor

**File:** `components/admin/map-pin-editor.tsx`

Interactive map editor for placing venue pins with drag-and-drop.

**Features:**

- Click anywhere on map to place new pins
- Drag existing pins to reposition
- Real-time coordinate display (% values)
- Grid overlay toggle (10% increment guidelines)
- Visual feedback (hover states, drag cursor)
- Pin labels showing venue name

**Usage:**

```tsx
<MapPinEditor
  mapUrl="/path/to/property-map.jpg"
  venues={childVenues}
  onUpdatePin={(venueId, mapX, mapY) => {
    // Save new coordinates to database
    updateVenueLocation(venueId, { mapX, mapY });
  }}
  onMapClick={(mapX, mapY) => {
    // Create new venue at clicked position
    console.log(`Create venue at ${mapX}%, ${mapY}%`);
  }}
  showGrid={true}
  editMode={true}
/>
```

**Props:**

- `mapUrl` - URL to map image
- `venues` - Array of child venues with `{ id, name, location: { mapX, mapY } }`
- `onUpdatePin` - Callback when pin dragged: `(venueId, newX, newY) => void`
- `onMapClick` - Callback when map clicked: `(x, y) => void`
- `showGrid` - Show 10% grid overlay (default: false)
- `editMode` - Enable pin dragging (default: true)

### Venue Form

**File:** `components/admin/venue-form.tsx`

Extended with hierarchical map support.

**New Fields:**

1. **Map Upload** - ImageUploadField for venue's own map
2. **Parent Venue** - Dropdown selector (shows property/building/floor venues)
3. **Map Coordinates** - X/Y inputs for pin position on parent's map
4. **Child Venues** - Display list of venues that use this venue as parent

**State Variables:**

```typescript
const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
const [mapImageMediaId, setMapImageMediaId] = useState<string | null>(null);
const [parentVenueId, setParentVenueId] = useState<string | null>(null);
const [location, setLocation] = useState<{
  mapX?: number;
  mapY?: number;
  lat?: number;
  lng?: number;
}>({});
```

**Save Logic:**

```typescript
const venueData = {
  // ... existing fields
  map_image_url: mapImageUrl,
  map_image_media_id: mapImageMediaId,
  parent_venue_id: parentVenueId,
  location: location,
};
```

### Resort Map

**File:** `components/map/resort-map.tsx`

Interactive resort map with hierarchical navigation.

**New Features:**

- **Breadcrumb Navigation** - Shows path from property to current venue
- **Dynamic Map Loading** - Displays map for `currentVenueId` or falls back to branding config
- **Hierarchy Mode** - Enable with `enableHierarchy={true}` prop
- **Child Venue Display** - Automatically loads and renders pins for child venues

**Usage (Client Visit):**

```tsx
<ResortMap
  currentVenueId={selectedVenueId}
  enableHierarchy={true}
  onVenueClick={(venueId) => {
    // Navigate to venue or drill down if has children
    setSelectedVenueId(venueId);
  }}
/>
```

**Usage (Admin):**

```tsx
<ResortMap
  currentVenueId={venueId}
  enableHierarchy={true}
  venues={allVenues} // Pass full venue list for breadcrumbs
/>
```

**Navigation Flow:**

1. Shows property-level map by default
2. Click venue pin → drills down to that venue's map (if it has one)
3. Breadcrumb trail allows navigating back up hierarchy
4. Leaf venues (spaces/outdoor) don't drill down further

### Venue Hierarchy Management

**File:** `app/admin/venues/hierarchy/page.tsx`

Tree view UI for managing venue structure.

**Features:**

- Expandable/collapsible tree nodes
- Icons by venue type (🏨 property, 🏢 building, 📐 floor, 🗺️ space)
- Stats dashboard:
  - Total venues
  - Map coverage percentage
  - Buildings count
  - Spaces count
- Action buttons per venue:
  - **Edit** - Opens venue form
  - **View Map** - Opens map viewer (if venue has map)
- Active/inactive badges
- Child count display

**Access:** Navigate to `/admin/venues/hierarchy`

## Implementation Guide

### 1. Run Database Migration

Execute in Supabase Studio SQL Editor:

```bash
# Copy contents of scripts/010_hierarchical_maps.sql
# Paste into SQL Editor
# Click "Run"
```

**Migration includes:**

- ALTER TABLE statements for new columns
- Recursive SQL functions
- Indexes on `parent_venue_id`
- Check constraints for venue types

### 2. Create Property Venue

1. Go to `/admin/venues/new`
2. Set **Type** to "Property"
3. Upload property-wide map image (e.g., aerial view of resort)
4. Fill in basic venue details
5. Leave **Parent Venue** empty (property is root)
6. Save venue

### 3. Create Building Venues

1. Go to `/admin/venues/new`
2. Set **Type** to "Building"
3. Select property as **Parent Venue**
4. Set **Map Coordinates** (X%, Y%) for pin position on property map
5. Upload building-specific map (optional, e.g., floor layout overview)
6. Save venue

### 4. Create Floor Venues

1. Go to `/admin/venues/new`
2. Set **Type** to "Floor"
3. Select building as **Parent Venue**
4. Set **Map Coordinates** for pin on building map
5. Upload floor plan image
6. Save venue

### 5. Create Space/Outdoor Venues

1. Go to `/admin/venues/new`
2. Set **Type** to "Space" or "Outdoor"
3. Select floor (or building) as **Parent Venue**
4. Set **Map Coordinates** for pin on floor plan
5. Leave map upload empty (leaf nodes typically don't have child maps)
6. Save venue

### 6. Position Pins Visually

Option A - **MapPinEditor Component:**

```tsx
// In custom admin page
<MapPinEditor
  mapUrl={venue.map_image_url}
  venues={childVenues}
  onUpdatePin={async (venueId, mapX, mapY) => {
    await supabase
      .from("venues")
      .update({ location: { mapX, mapY } })
      .eq("id", venueId);
  }}
/>
```

Option B - **Manual Input:**

- Edit venue in form
- Enter precise X/Y percentages in coordinate inputs
- Use grid overlay reference (10% increments)

## Example Hierarchy Setup

### Conrad Tulum Complete Structure

```
Conrad Tulum (Property)
├── Main Building (Building)
│   ├── Ground Floor (Floor)
│   │   ├── Grand Ballroom (Space)
│   │   ├── Coral Restaurant (Space)
│   │   └── Lobby Bar (Space)
│   ├── 2nd Floor (Floor)
│   │   ├── Board Room A (Space)
│   │   └── Board Room B (Space)
│   └── 3rd Floor (Floor)
│       └── Executive Suite (Space)
├── Spa Complex (Building)
│   └── Ground Floor (Floor)
│       ├── Treatment Room 1 (Space)
│       ├── Treatment Room 2 (Space)
│       └── Relaxation Lounge (Space)
└── Outdoor Areas (Building - logical grouping)
    ├── Beach Area (Outdoor)
    ├── Main Pool (Outdoor)
    └── Gardens (Outdoor)
```

### Map Assignment Strategy

**Property Level:**

- Aerial view or master site plan
- Shows building locations as pins

**Building Level:**

- Exterior photo or multi-floor diagram
- Shows floor levels as pins (if building has multiple floors)
- Or directly show spaces if single-floor building

**Floor Level:**

- Detailed floor plan
- Shows individual spaces/rooms as pins

**Space/Outdoor Level:**

- Typically no map (leaf nodes)
- Could have interior photos or 360° tours (future enhancement)

## Data Migration

### Migrate Existing Resort Map

```typescript
// Create property venue from existing branding config
const { data: property } = await supabase
  .from("venues")
  .insert({
    name: "Conrad Tulum",
    venue_type: "property",
    property_id: CONRAD_TULUM_PROPERTY_ID,
    map_image_url: branding.images.resortMap, // From branding config
    parent_venue_id: null, // Root level
    is_active: true,
  })
  .select()
  .single();

// Update existing venues with property as parent
await supabase
  .from("venues")
  .update({ parent_venue_id: property.id })
  .is("parent_venue_id", null); // Only venues without parent
```

### Calculate Legacy Coordinates

If existing venues have GPS coordinates but no map coordinates:

```typescript
// Pseudo-code for converting GPS to map percentages
// (requires knowing map bounds and projection)

const mapBounds = {
  north: 20.892,
  south: 20.882,
  east: -87.042,
  west: -87.052,
};

function gpsToMapPercent(lat: number, lng: number) {
  const mapX =
    ((lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * 100;
  const mapY =
    ((mapBounds.north - lat) / (mapBounds.north - mapBounds.south)) * 100;
  return { mapX, mapY };
}
```

## API Queries

### Get Venue Path (Breadcrumbs)

```typescript
const { data: path } = await supabase.rpc("get_venue_path", {
  venue_id: venueId,
});

// Returns: [
//   { id: '...', name: 'Conrad Tulum', venue_type: 'property' },
//   { id: '...', name: 'Main Building', venue_type: 'building' },
//   { id: '...', name: 'Ground Floor', venue_type: 'floor' }
// ]
```

### Get Child Venues

```typescript
const { data: children } = await supabase.rpc("get_child_venues", {
  venue_id: venueId,
});

// Returns array of direct children with location data
```

### Query Full Tree

```typescript
// Recursive query to build entire hierarchy
async function getVenueTree(parentId: string | null = null) {
  const { data: venues } = await supabase
    .from("venues")
    .select("*")
    .eq("parent_venue_id", parentId)
    .order("name");

  for (const venue of venues) {
    venue.children = await getVenueTree(venue.id);
  }

  return venues;
}

const tree = await getVenueTree(null); // Start from root
```

## Best Practices

### Map Image Recommendations

- **Resolution:** Minimum 1920x1080px for property/building maps
- **Format:** JPEG for photos, PNG for floor plans with transparency
- **Aspect Ratio:** 16:9 preferred for consistent UI across levels
- **File Size:** Compress to <2MB (use ImageUploadField compression)
- **Annotation:** Use high-contrast colors for existing labels/text

### Pin Placement

- **Spacing:** Minimum 5% between pins to prevent overlap
- **Accuracy:** Use grid overlay to align pins to architectural elements
- **Visibility:** Ensure pins don't obscure important map details
- **Grouping:** For clusters, consider zooming in to floor level

### Venue Type Selection

- Use **building** for physical structures, even if single-floor
- Use **floor** only when building has multiple levels
- Group related outdoor areas under logical **building** parent
- Reserve **space** for bookable/tourable venues only

### Parent-Child Relationships

- **Property** → Always root (null parent)
- **Building** → Must have property as parent
- **Floor** → Must have building as parent
- **Space/Outdoor** → Can have floor OR building as parent

### Performance

- **Lazy Load Maps:** Only fetch map images when drilling down
- **Cache Venue Trees:** Store hierarchy in client state to minimize queries
- **Index Optimization:** Migration includes index on `parent_venue_id`
- **Limit Depth:** Recommend max 4 levels (property → building → floor → space)

## Troubleshooting

### Pins Not Showing

1. Check venue has `location.mapX` and `location.mapY` set
2. Verify parent venue has `map_image_url` or `map_image_media_id`
3. Confirm venue's `parent_venue_id` matches current map venue

### Breadcrumbs Missing

1. Ensure `get_venue_path` function exists in database
2. Check venue has valid `parent_venue_id` chain to root
3. Verify no circular references (venue parent = itself)

### Map Not Loading

1. Check `map_image_url` is valid and accessible
2. If using `map_image_media_id`, verify media exists in `media_library`
3. Confirm Supabase Storage bucket permissions allow public access
4. Check browser console for CORS or 404 errors

### Drag-and-Drop Not Working

1. Verify `editMode={true}` prop on MapPinEditor
2. Check venue is in `venues` array passed to component
3. Ensure `onUpdatePin` callback is provided
4. Confirm no CSS `pointer-events: none` on parent elements

## Future Enhancements

- [ ] Bulk pin placement (upload CSV with coordinates)
- [ ] Map rotation/alignment tools for scanned floor plans
- [ ] 360° photo integration for space-level views
- [ ] GPS auto-positioning using device location
- [ ] Printable maps with venue key/legend
- [ ] Multi-language map labels
- [ ] Accessibility mode (high contrast pins, text alternatives)

## Related Documentation

- `docs/PHASE2_COMPLETE.md` - Media library system integration
- `docs/IMAGE_UPLOAD_IMPLEMENTATION.md` - ImageUploadField component details
- `scripts/010_hierarchical_maps.sql` - Database schema and migration
- `lib/supabase/types.ts` - Venue interface TypeScript definitions
