# Phase 1: Mobile-First Tour Experience - Implementation Plan

## Overview

Phase 1 focuses on transforming the tour mode into an immersive, mobile-first experience with native capture capabilities. This enables Sales Directors to capture photos and voice notes in real-time during site tours, dramatically improving the quality and speed of post-visit recaps.

## Deliverables

### 1. Database Schema Extensions

New tables to support media capture during tours:

```sql
-- media_library: Centralized storage for all media
-- venue_media: Junction table for venue-media relationships
-- visit_captures: Photos and voice notes captured during tours
-- visit_annotations: Rich feedback (reactions, questions, concerns)
```

### 2. New Components

| Component        | Purpose                                     | Location                                |
| ---------------- | ------------------------------------------- | --------------------------------------- |
| `CaptureToolbar` | Floating action bar for capture actions     | `components/client/capture-toolbar.tsx` |
| `CameraCapture`  | Native camera access with photo capture     | `components/client/camera-capture.tsx`  |
| `VoiceRecorder`  | Audio recording with waveform visualization | `components/client/voice-recorder.tsx`  |
| `CapturePreview` | Grid of captured media during tour          | `components/client/capture-preview.tsx` |
| `QuickReactions` | Emoji-based quick feedback                  | `components/client/quick-reactions.tsx` |

### 3. API Routes

| Route                | Method | Purpose                                  |
| -------------------- | ------ | ---------------------------------------- |
| `/api/transcribe`    | POST   | Transcribe voice notes using Whisper API |
| `/api/captures`      | POST   | Save capture metadata to database        |
| `/api/captures/[id]` | DELETE | Remove a capture                         |

### 4. Enhanced Tour Mode

Updates to existing `TourMode` component:

- Floating capture toolbar at bottom
- Capture preview strip at top
- Swipe gestures for navigation
- Haptic feedback on interactions
- Real-time sync indicator

### 5. Media Management System (Phase 3-5)

A comprehensive system for managing and displaying venue assets.

#### Admin Components

- **MediaUploadZone**: Drag-and-drop upload with progress tracking and type validation.
- **MediaPicker**: Central modal for selecting media from the library with filtering and search.
- **VenueMediaManager**: Tabbed interface for organizing venue media by context (Hero, Gallery, Floorplans, etc.).
- **AssetMediaManager**: Role-based interface for organizing sales assets (Primary, Thumbnail) with language support.
- **PDFPreview**: Visualization of PDF files with extracted data (tables, text).

#### Client Components

- **VenueMediaViewer**: Mobile-friendly viewer for venue resources (Floorplans, Capacities, Menus).
- **CapacityTable**: Rendering of extracted capacity data from PDFs.

#### Integration

- **TourMode**: Updated to use `VenueMediaViewer` and fetch media from the new system.
- **Forms**: `VenueForm` and `AssetForm` refactored to use the new media managers, replacing legacy URL fields.

## Database Migration

### New Tables

#### `media_library`

Central repository for all uploaded media files.

| Column         | Type        | Description                         |
| -------------- | ----------- | ----------------------------------- |
| id             | UUID        | Primary key                         |
| property_id    | UUID        | FK to properties                    |
| file_name      | TEXT        | Original filename                   |
| file_type      | TEXT        | image, video, audio, document       |
| mime_type      | TEXT        | MIME type                           |
| storage_path   | TEXT        | Supabase Storage path               |
| thumbnail_path | TEXT        | Thumbnail path for previews         |
| file_size      | INTEGER     | Size in bytes                       |
| dimensions     | JSONB       | {width, height} for images/video    |
| duration       | INTEGER     | Duration in seconds for audio/video |
| metadata       | JSONB       | Additional metadata                 |
| tags           | TEXT[]      | Searchable tags                     |
| uploaded_by    | UUID        | FK to auth.users                    |
| source         | TEXT        | upload, capture, ai_generated       |
| created_at     | TIMESTAMPTZ | Creation timestamp                  |

#### `venue_media`

Junction table linking venues to media library.

| Column        | Type    | Description                    |
| ------------- | ------- | ------------------------------ |
| id            | UUID    | Primary key                    |
| venue_id      | UUID    | FK to venues                   |
| media_id      | UUID    | FK to media_library            |
| is_primary    | BOOLEAN | Primary display image          |
| display_order | INTEGER | Gallery ordering               |
| context       | TEXT    | hero, gallery, floorplan, etc. |

#### `visit_captures`

Photos and voice notes captured during tours.

| Column        | Type        | Description                      |
| ------------- | ----------- | -------------------------------- |
| id            | UUID        | Primary key                      |
| visit_stop_id | UUID        | FK to visit_stops                |
| media_id      | UUID        | FK to media_library              |
| capture_type  | TEXT        | photo, voice_note, video         |
| caption       | TEXT        | User-provided caption            |
| transcript    | TEXT        | AI transcription for voice notes |
| sentiment     | TEXT        | positive, neutral, negative      |
| captured_at   | TIMESTAMPTZ | Capture timestamp                |
| captured_by   | TEXT        | sales or client                  |
| location      | JSONB       | GPS coordinates if available     |

#### `visit_annotations`

Rich feedback and reactions during tours.

| Column          | Type        | Description                            |
| --------------- | ----------- | -------------------------------------- |
| id              | UUID        | Primary key                            |
| visit_stop_id   | UUID        | FK to visit_stops                      |
| annotation_type | TEXT        | reaction, question, concern, highlight |
| content         | TEXT        | Text content                           |
| emoji           | TEXT        | Emoji reaction                         |
| priority        | INTEGER     | Importance level                       |
| created_at      | TIMESTAMPTZ | Creation timestamp                     |

### visit_stops Enhancements

New columns added to existing table:

| Column             | Type    | Description                   |
| ------------------ | ------- | ----------------------------- |
| time_spent_seconds | INTEGER | Duration at this stop         |
| engagement_score   | INTEGER | Calculated interaction score  |
| ai_sentiment       | TEXT    | AI-analyzed overall sentiment |
| follow_up_required | BOOLEAN | Flag for follow-up needed     |

## Component Specifications

### CaptureToolbar

```typescript
interface CaptureToolbarProps {
  visitStopId: string;
  venueId: string;
  venueName: string;
  onCapture: (capture: CaptureResult) => void;
  disabled?: boolean;
}

interface CaptureResult {
  type: "photo" | "voice_note" | "reaction" | "note";
  mediaId?: string;
  content?: string;
  emoji?: string;
  transcript?: string;
}
```

Features:

- Fixed position at bottom of screen
- Four action buttons: Photo, Voice, React, Note
- Animated button states
- Haptic feedback on tap
- Permission request handling

### CameraCapture

```typescript
interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File, metadata: PhotoMetadata) => Promise<void>;
  venueContext?: string;
}

interface PhotoMetadata {
  capturedAt: Date;
  location?: { lat: number; lng: number };
  venueId: string;
  venueName: string;
}
```

Features:

- Full-screen camera view
- Front/back camera toggle
- Flash control (if available)
- Capture button with animation
- Preview with retake/use options
- Caption input before saving
- Auto-upload to Supabase Storage

### VoiceRecorder

```typescript
interface VoiceRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (result: VoiceRecordingResult) => Promise<void>;
  maxDuration?: number; // seconds, default 120
}

interface VoiceRecordingResult {
  audioBlob: Blob;
  duration: number;
  transcript?: string;
  sentiment?: "positive" | "neutral" | "negative";
}
```

Features:

- Large tap-to-record button
- Waveform visualization (Web Audio API)
- Recording timer display
- Stop and preview controls
- Playback with seek
- Auto-transcription via API
- Re-record or confirm flow

### CapturePreview

```typescript
interface CapturePreviewProps {
  captures: VisitCapture[];
  onRemove: (captureId: string) => void;
  onPreview: (capture: VisitCapture) => void;
  compact?: boolean;
}
```

Features:

- Horizontal scrolling strip
- Thumbnail previews
- Type indicators (photo/voice/note)
- Swipe to delete
- Tap to expand
- Count badge

## API Specifications

### POST /api/transcribe

Request:

```typescript
{
  audioBlob: Blob; // FormData with audio file
  language?: string; // default 'en'
}
```

Response:

```typescript
{
  transcript: string;
  duration: number;
  language: string;
  sentiment: "positive" | "neutral" | "negative";
}
```

Implementation:

- Accept audio file via FormData
- Send to OpenAI Whisper API
- Analyze transcript for sentiment
- Return results

### POST /api/captures

Request:

```typescript
{
  visitStopId: string;
  captureType: 'photo' | 'voice_note';
  storagePath: string;
  caption?: string;
  transcript?: string;
  sentiment?: string;
  location?: { lat: number; lng: number };
  capturedBy: 'sales' | 'client';
}
```

Response:

```typescript
{
  id: string;
  mediaId: string;
  createdAt: string;
}
```

## File Structure

```
components/
  client/
    capture-toolbar.tsx      # Floating action bar
    camera-capture.tsx       # Camera modal
    voice-recorder.tsx       # Voice recording modal
    capture-preview.tsx      # Captured media strip
    quick-reactions.tsx      # Emoji reaction picker
    tour-mode.tsx           # Enhanced (existing)

app/
  api/
    transcribe/
      route.ts              # Whisper transcription
    captures/
      route.ts              # Create capture
      [id]/
        route.ts            # Delete capture

lib/
  supabase/
    types.ts                # Extended types
  hooks/
    use-camera.ts           # Camera access hook
    use-audio-recorder.ts   # Audio recording hook
    use-geolocation.ts      # GPS location hook

supabase/
  migrations/
    20241206_phase1_media_schema.sql
```

## Implementation Order

1. **Database Migration** (30 min)

   - Create migration file
   - Run migration in Supabase
   - Update TypeScript types

2. **Core Hooks** (1 hour)

   - `useCamera` - camera access with permissions
   - `useAudioRecorder` - MediaRecorder with waveform
   - `useGeolocation` - GPS coordinates

3. **Capture Components** (2 hours)

   - CameraCapture with preview flow
   - VoiceRecorder with waveform
   - CaptureToolbar integration
   - CapturePreview strip

4. **API Routes** (1 hour)

   - Transcription endpoint
   - Captures CRUD

5. **TourMode Integration** (1 hour)
   - Add CaptureToolbar
   - Add CapturePreview
   - Wire up state management
   - Test full flow

## Environment Variables Required

```env
# For voice transcription (optional, graceful fallback)
OPENAI_API_KEY=sk-...
```

## Testing Checklist

- [ ] Camera opens on mobile Safari
- [ ] Camera opens on mobile Chrome
- [ ] Photo captures and uploads successfully
- [ ] Voice recording works with visual feedback
- [ ] Transcription returns (or graceful fallback)
- [ ] Captures appear in preview strip
- [ ] Captures persist after navigation
- [ ] Geolocation captured (with permission)
- [ ] Works offline (queues for later)
- [ ] Build passes with no TypeScript errors

## Success Criteria

| Metric                      | Target       |
| --------------------------- | ------------ |
| Photo capture to preview    | < 2 seconds  |
| Voice recording start       | < 500ms      |
| Transcription complete      | < 10 seconds |
| Mobile Safari compatibility | 100%         |
| Mobile Chrome compatibility | 100%         |
