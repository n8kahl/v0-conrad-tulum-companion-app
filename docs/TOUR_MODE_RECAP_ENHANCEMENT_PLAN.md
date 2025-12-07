# Tour Mode & Recap Enhancement Implementation Plan

**Date**: December 6, 2024  
**Scope**: Upgrade Tour Mode from demo to powerful on-site tool + Visual storytelling in Recap

## Current State Analysis

### Tour Mode (`components/client/tour-mode.tsx` - 1109 lines)

**Existing Features:**

- ✅ Sequential walk-through of visit_stops
- ✅ Hero image display per venue
- ✅ Next/previous controls + progress tracking
- ✅ Voice guidance with speech synthesis
- ✅ Capture system with photos, voice notes, reactions
- ✅ Camera capture via CameraCapture component
- ✅ Voice recording via VoiceRecorder component
- ✅ CaptureToolbar and CapturePreview components
- ✅ Writes to visit_captures table via /api/captures endpoint

**Current Hero Image Logic:**

```tsx
// Lines 750-780: Uses first image from media_library or legacy venue.images[0]
const imageUrl = heroMedia?.storage_path
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${heroMedia.storage_path}`
  : venue.images?.[0] || "/placeholder.svg";
```

**Current Capture Flow:**

1. Camera capture → Upload to Supabase Storage → POST to /api/captures
2. Voice note → Upload audio → Transcribe → Save to visit_captures
3. Reactions → Stored in local state (not persisted to DB yet)

**Missing:**

- ❌ No venue_media context grouping (floorplans, menus, AV diagrams)
- ❌ No "Resources" drawer/panel
- ❌ Quick reactions not saved to visit_captures
- ❌ No capture summary UI per stop

### Recap View (`components/recap/recap-view.tsx` - 503 lines)

**Existing Sections:**

1. Summary Card (visit stats, print/proposal CTAs)
2. Program Scenarios (auto-generated from venue types)
3. Favorited Venues (uses VenueHighlightCard)
4. Complete Tour Route (all stops list)
5. Visit Summary stats
6. Next Steps card

**Current Data Flow:**

- Fetches visit, stops, property
- Displays favorited stops with VenueHighlightCard
- NO visit_captures fetching yet
- NO asset resources shown

### Venue Highlight Card (`components/recap/venue-highlight-card.tsx` - 162 lines)

**Current Display:**

- Hero image from venue_media or legacy images
- Venue name, type, description
- Capacity stats (reception, banquet)
- Features badges
- Tour photos (from stop.photos array - LEGACY FIELD)
- Client reaction (from stop.client_reaction)

**Missing:**

- ❌ Best tour photo selection (no visit_captures integration)
- ❌ Photo/note/reaction counts
- ❌ Media & resources drawer
- ❌ Related assets display

## Implementation Priority

### Phase A: Tour Mode Enhancements (HIGH PRIORITY)

#### A1. Add Venue Media Resource Panel

**Files**: `components/client/tour-mode.tsx`, new `components/client/venue-resources-drawer.tsx`

**Changes:**

1. Query venue_media with contexts:

   ```tsx
   const resourcesByContext = useMemo(() => {
     if (!currentStop?.venue?.venue_media) return {};

     return currentStop.venue.venue_media.reduce((acc, vm) => {
       if (!acc[vm.context]) acc[vm.context] = [];
       acc[vm.context].push(vm);
       return acc;
     }, {} as Record<string, VenueMedia[]>);
   }, [currentStop]);

   const heroMedia =
     resourcesByContext.hero?.[0] || resourcesByContext.gallery?.[0];
   const galleryMedia = resourcesByContext.gallery || [];
   const floorplans = [
     ...(resourcesByContext.floorplan || []),
     ...(resourcesByContext.capacity_chart || []),
   ];
   const menus = resourcesByContext.menu || [];
   const avDiagrams = resourcesByContext.av_diagram || [];
   ```

2. Add "Resources" button under hero image:

   ```tsx
   {
     (galleryMedia.length > 0 || floorplans.length > 0 || menus.length > 0) && (
       <Button
         variant="outline"
         size="sm"
         onClick={() => setShowResourcesDrawer(true)}
       >
         <FileText className="h-4 w-4 mr-2" />
         Venue Resources ({galleryMedia.length +
           floorplans.length +
           menus.length})
       </Button>
     );
   }
   ```

3. Create `VenueResourcesDrawer` component with tabs:
   - **Photos**: Gallery context images
   - **Floorplans**: Floorplan + capacity_chart contexts
   - **Menus**: Menu context PDFs
   - **AV & Tech**: av_diagram context

#### A2. Improve Capture UX

**Files**: `components/client/tour-mode.tsx`

**Changes:**

1. Add capture summary panel above capture toolbar:

   ```tsx
   const stopCaptures = captures.filter(c => c.visit_stop_id === currentStop.id)
   const photoCount = stopCaptures.filter(c => c.capture_type === 'photo').length
   const noteCount = stopCaptures.filter(c => c.capture_type === 'note').length
   const isFavorited = currentStop.client_favorited

   <div className="bg-muted/50 px-4 py-3 rounded-lg">
     <div className="flex items-center gap-3 text-sm">
       {photoCount > 0 && (
         <span className="flex items-center gap-1">
           <Camera className="h-4 w-4" />
           {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
         </span>
       )}
       {noteCount > 0 && (
         <span className="flex items-center gap-1">
           <MessageSquare className="h-4 w-4" />
           {noteCount} {noteCount === 1 ? 'note' : 'notes'}
         </span>
       )}
       {isFavorited && (
         <span className="flex items-center gap-1 text-primary">
           <Heart className="h-4 w-4 fill-current" />
           Favorited
         </span>
       )}
     </div>
   </div>
   ```

2. Save reactions to visit_captures:

   ```tsx
   const handleQuickReaction = async (emoji: string) => {
     try {
       const response = await fetch("/api/captures", {
         method: "POST",
         body: JSON.stringify({
           visitStopId: currentStop.id,
           captureType: "reaction",
           caption: emoji,
           capturedBy: "client",
         }),
       });

       if (response.ok) {
         const data = await response.json();
         setCaptures((prev) => [...prev, data.capture]);
         toast.success(`Reaction added: ${emoji}`);
       }
     } catch (error) {
       toast.error("Failed to save reaction");
     }
   };
   ```

3. Add quick note input:
   ```tsx
   <Textarea
     placeholder="Add a quick note about this space..."
     maxLength={300}
     value={quickNoteText}
     onChange={(e) => setQuickNoteText(e.target.value)}
   />
   <Button size="sm" onClick={handleSaveQuickNote}>
     Save Note
   </Button>
   ```

### Phase B: Recap Enhancements (HIGH PRIORITY)

#### B1. Fetch visit_captures in Recap Page

**Files**: `app/recap/[token]/page.tsx`

**Changes:**

```tsx
// Add to existing queries
const { data: captures } = await supabase
  .from('visit_captures')
  .select(`
    *,
    media:media_library(*)
  `)
  .in('visit_stop_id', stops.map(s => s.id))
  .order('captured_at', { ascending: false })

// Pass to RecapView
<RecapView visit={visit} stops={stops} property={property} captures={captures || []} />
```

#### B2. Upgrade VenueHighlightCard with Captures

**Files**: `components/recap/venue-highlight-card.tsx`

**Changes:**

1. Add helper functions:

   ```tsx
   function pickRecapHeroForVenue(args: {
     venue: Venue & { venue_media?: VenueMedia[] };
     captures: VisitCapture[];
   }): { heroUrl: string | null; from: "capture" | "venue" | "legacy" } {
     // Prefer latest tour photo
     const photoCapture = captures.find(
       (c) => c.capture_type === "photo" && c.media?.storage_path
     );
     if (photoCapture?.media?.storage_path) {
       return {
         heroUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${photoCapture.media.storage_path}`,
         from: "capture",
       };
     }

     // Fallback to venue hero
     const heroMedia = args.venue.venue_media?.find(
       (vm) => vm.context === "hero"
     );
     if (heroMedia?.media?.storage_path) {
       return {
         heroUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${heroMedia.media.storage_path}`,
         from: "venue",
       };
     }

     // Last resort: legacy field
     return {
       heroUrl: args.venue.images?.[0] || null,
       from: "legacy",
     };
   }

   function computeVenueRecapStats(args: { captures: VisitCapture[] }) {
     return {
       photoCount: args.captures.filter((c) => c.capture_type === "photo")
         .length,
       noteCount: args.captures.filter(
         (c) => c.capture_type === "note" || c.capture_type === "voice_note"
       ).length,
       positiveReactions: args.captures.filter(
         (c) =>
           c.capture_type === "reaction" &&
           ["👍", "⭐", "❤️", "🔥"].includes(c.caption || "")
       ).length,
       favorite: false, // Set from stop.client_favorited
     };
   }
   ```

2. Update component to accept captures:

   ```tsx
   interface VenueHighlightCardProps {
     stop: VisitStop & { venue: Venue };
     captures: VisitCapture[];
     index: number;
   }

   export function VenueHighlightCard({
     stop,
     captures,
     index,
   }: VenueHighlightCardProps) {
     const stopCaptures = captures.filter((c) => c.visit_stop_id === stop.id);
     const stats = computeVenueRecapStats({ captures: stopCaptures });
     const { heroUrl, from } = pickRecapHeroForVenue({
       venue: stop.venue,
       captures: stopCaptures,
     });

     // Use heroUrl for main image
     // Show stats pill: "{photoCount} photos · {noteCount} notes · ⭐ Favorited"
     // Add "View all media & resources" CTA button
   }
   ```

#### B3. Add Resources Section to Recap

**Files**: `components/recap/recap-view.tsx`

**Changes:**

1. Fetch assets in page:

   ```tsx
   const { data: assets } = await supabase
     .from("assets")
     .select("*")
     .eq("property_id", visit.property_id)
     .eq("is_active", true)
     .order("sort_order");
   ```

2. Add section before "Next Steps":
   ```tsx
   <section className="mb-8">
     <div className="flex items-center gap-2 mb-4">
       <FileText className="h-5 w-5 text-primary" />
       <h2 className="text-lg font-semibold">Planning Resources</h2>
     </div>
     <div className="space-y-6">
       <AssetBundleStrip
         title="Fact Sheets & Capacity Charts"
         assets={assets.filter((a) =>
           matchesKeywords(a, ["fact", "capacity", "chart"])
         )}
         viewAllHref="/explore/assets?category=events"
       />
       <AssetBundleStrip
         title="Resort Maps & Guides"
         assets={assets.filter((a) =>
           matchesKeywords(a, ["map", "guide", "directory"])
         )}
         viewAllHref="/explore/assets?category=maps"
       />
     </div>
   </section>
   ```

## Data Model Alignment

### visit_captures Structure (EXISTING - DO NOT MODIFY)

```sql
CREATE TABLE visit_captures (
  id UUID PRIMARY KEY,
  visit_stop_id UUID REFERENCES visit_stops(id),
  media_id UUID REFERENCES media_library(id),
  capture_type TEXT CHECK (capture_type IN ('photo', 'voice_note', 'video_clip', 'annotation', 'reaction', 'note')),
  caption TEXT,
  transcript TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'excited', 'concerned')),
  captured_by TEXT,
  captured_at TIMESTAMP,
  location JSONB,
  created_at TIMESTAMP
)
```

**Capture Types Usage:**

- `photo`: Camera captures during tour → Show in recap gallery
- `voice_note`: Audio with transcript → Use for "client feedback" in recap
- `reaction`: Quick emoji reactions (caption field = emoji) → Count for highlights
- `note`: Text notes → Surface in recap as bullet points
- `annotation`: Complex annotations (not implemented yet)

### venue_media Contexts (EXISTING)

- `hero`: Primary showcase image (use for recap hero if no capture)
- `gallery`: General photos (show in resources drawer)
- `floorplan`: Floor plans (show in resources drawer)
- `capacity_chart`: Capacity diagrams (show in resources drawer)
- `menu`: F&B menus (show in resources drawer)
- `av_diagram`: AV equipment layouts (show in resources drawer)
- `setup_*`: Setup examples (show in resources drawer)

## Implementation Checklist

### Tour Mode

- [ ] Add `VenueResourcesDrawer` component with tabs
- [ ] Query venue_media by context
- [ ] Add "Resources" button to tour UI
- [ ] Add capture summary panel per stop
- [ ] Save reactions to visit_captures
- [ ] Add quick note textarea
- [ ] Update capture counts in real-time

### Recap

- [ ] Fetch visit_captures in page
- [ ] Pass captures to RecapView and VenueHighlightCard
- [ ] Implement `pickRecapHeroForVenue()` helper
- [ ] Implement `computeVenueRecapStats()` helper
- [ ] Update VenueHighlightCard UI with stats pill
- [ ] Add "View media & resources" drawer/modal
- [ ] Fetch and display assets
- [ ] Create Planning Resources section with AssetBundleStrip

### Testing

- [ ] Test tour mode on iOS Safari (primary target)
- [ ] Test camera/voice captures save correctly
- [ ] Test reactions persist to visit_captures
- [ ] Verify recap shows tour photos first
- [ ] Verify resource drawers show correct contexts
- [ ] Test asset grouping logic

## Next Steps

Due to the file sizes (tour-mode.tsx is 1109 lines), I recommend:

1. **Start with Tour Mode Phase A1**: Add VenueResourcesDrawer component first (new file)
2. **Then Tour Mode Phase A2**: Enhance capture UX in existing tour-mode.tsx
3. **Then Recap Phase B1**: Update page query
4. **Finally Recap Phase B2-B3**: Enhance cards and add resources

Would you like me to:

1. Implement the VenueResourcesDrawer component first?
2. Or start with the capture UX improvements?
3. Or focus on Recap enhancements first?
