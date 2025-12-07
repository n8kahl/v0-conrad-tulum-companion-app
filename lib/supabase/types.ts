export type AssetType = "pdf" | "flipbook" | "image" | "video" | "virtual_tour" | "diagram"
export type AssetCategory = "sales" | "weddings" | "spa" | "events" | "marketing"
export type VenueType = "meeting_room" | "outdoor" | "restaurant" | "spa" | "pool" | "lobby" | "ballroom" | "beach"
export type GroupType = "MICE" | "incentive" | "wedding" | "retreat" | "buyout" | "conference"
export type VisitStatus = "planning" | "scheduled" | "in_progress" | "completed" | "proposal_sent"

export interface Property {
  id: string
  name: string
  slug: string
  brand_colors: {
    primary: string
    secondary: string
    accent: string
    background?: string
    text?: string
  }
  logo_url: string | null
  location: {
    address: string
    coordinates: { lat: number; lng: number }
    airport_code: string
    transfer_time?: string
  }
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  property_id: string
  name: string
  asset_type: AssetType
  category: AssetCategory
  language: string
  urls: {
    pdf_en?: string
    pdf_es?: string
    flipbook_en?: string
    flipbook_es?: string
    pdf?: string
    flipbook?: string
    firstview?: string
    tour_url?: string
  }
  thumbnail_url: string | null
  tags: string[]
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Collection {
  id: string
  property_id: string
  name: string
  description: string | null
  cover_image_url: string | null
  asset_ids: string[]
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Venue {
  id: string
  property_id: string
  name: string
  venue_type: VenueType
  capacities: {
    theater?: number
    classroom?: number
    banquet?: number
    reception?: number
    u_shape?: number
    boardroom?: number
    ceremony?: number
    wellness_group?: number
    buyout?: number
    casual_dining?: number
    networking?: number
  }
  dimensions: {
    length_m?: number
    width_m?: number
    height_m?: number
    sqm: number
  }
  features: string[]
  images: string[]
  floorplan_url: string | null
  map_coordinates: { x?: number; y?: number }
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SiteVisit {
  id: string
  property_id: string
  client_company: string
  client_contact: {
    name: string
    email: string
    phone?: string
    title?: string
  }
  group_type: GroupType
  estimated_attendees: number | null
  preferred_dates: {
    start?: string
    end?: string
    flexible?: boolean
  }
  visit_date: string | null
  status: VisitStatus
  share_token: string
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface VisitStop {
  id: string
  site_visit_id: string
  venue_id: string
  order_index: number
  scheduled_time: string | null
  sales_notes: string | null
  client_reaction: string | null
  client_favorited: boolean
  photos: string[]
  created_at: string
  updated_at: string
  venue?: Venue
}

export interface Profile {
  id: string
  full_name: string | null
  role: string
  property_id: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// ============================================
// Phase 1: Media Library Types
// ============================================

export type MediaFileType = "image" | "video" | "audio" | "document" | "pdf"
export type MediaSource = "upload" | "capture" | "ai_generated"
export type CaptureType = "photo" | "voice_note" | "video"
export type Sentiment = "positive" | "neutral" | "negative"
export type AnnotationType = "reaction" | "question" | "concern" | "highlight" | "note"
export type MediaContext = "hero" | "gallery" | "floorplan" | "menu" | "capacity_chart" | "av_diagram" | "setup_theater" | "setup_banquet" | "setup_classroom" | "setup_reception" | "360_tour" | "video_walkthrough" | "previous_event"
export type CapturedBy = "sales" | "client"

export interface MediaLibrary {
  id: string
  property_id: string
  file_name: string
  file_type: MediaFileType
  mime_type: string
  storage_path: string
  thumbnail_path: string | null
  file_size: number | null
  dimensions: {
    width?: number
    height?: number
  }
  duration: number | null
  metadata: Record<string, unknown>
  tags: string[]
  uploaded_by: string | null
  source: MediaSource
  created_at: string
  updated_at: string
}

export interface VenueMedia {
  id: string
  venue_id: string
  media_id: string
  is_primary: boolean
  display_order: number
  context: MediaContext
  created_at: string
  media?: MediaLibrary
}

export interface VisitCapture {
  id: string
  visit_stop_id: string
  media_id: string
  capture_type: CaptureType
  caption: string | null
  transcript: string | null
  sentiment: Sentiment | null
  captured_at: string
  captured_by: CapturedBy
  location: {
    lat: number
    lng: number
  } | null
  created_at: string
  media?: MediaLibrary
}

export interface VisitAnnotation {
  id: string
  visit_stop_id: string
  annotation_type: AnnotationType
  content: string | null
  emoji: string | null
  priority: number
  created_by: CapturedBy
  created_at: string
}

export interface RecapDraft {
  id: string
  site_visit_id: string
  version: number
  ai_summary: string | null
  key_highlights: {
    venueId: string
    venueName: string
    sentiment: Sentiment
    keyPoints: string[]
    clientQuotes: string[]
  }[]
  recommended_next_steps: string[]
  proposal_talking_points: string[]
  concerns: string[]
  generated_at: string
  approved: boolean
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

// Extended VisitStop with Phase 1 fields
export interface VisitStopExtended extends VisitStop {
  time_spent_seconds: number
  engagement_score: number
  ai_sentiment: Sentiment | null
  follow_up_required: boolean
  captures?: VisitCapture[]
  annotations?: VisitAnnotation[]
}

// ============================================
// Media Library System Types (Migration 007)
// ============================================

export type NewMediaFileType = 
  | "image" 
  | "video" 
  | "pdf" 
  | "document" 
  | "audio" 
  | "floorplan" 
  | "360_tour"

export type MediaStatus = "uploading" | "processing" | "ready" | "failed"

export type VenueMediaContext = 
  | "hero"
  | "gallery"
  | "floorplan"
  | "capacity_chart"
  | "setup_theater"
  | "setup_banquet"
  | "setup_classroom"
  | "setup_reception"
  | "menu"
  | "av_diagram"
  | "360_tour"
  | "video_walkthrough"
  | "previous_event"

export type CaptureTypeExtended = "photo" | "voice_note" | "video_clip" | "annotation"
export type SentimentExtended = "positive" | "neutral" | "negative" | "excited" | "concerned"

// Media Library - Central repository for all files
export interface MediaLibraryItem {
  id: string
  property_id: string
  
  // File info
  original_filename: string
  file_type: NewMediaFileType
  mime_type: string
  file_size_bytes: number
  
  // Storage paths
  storage_path: string
  thumbnail_path: string | null
  preview_path: string | null
  blurhash: string | null
  
  // Processing status
  status: MediaStatus
  processed_at: string | null
  processing_error: string | null
  
  // Metadata (JSONB - varies by file type)
  metadata: {
    // Images
    width?: number
    height?: number
    exif?: Record<string, unknown>
    dominant_colors?: string[]
    
    // PDFs
    page_count?: number
    extracted_text?: string
    tables?: unknown[]
    document_type?: string
    
    // Videos
    duration_seconds?: number
    codec?: string
    
    // Audio
    transcript?: string
    sentiment?: string
  }
  
  // Tags
  ai_tags: string[]
  custom_tags: string[]
  
  // Manual metadata
  title: string | null
  description: string | null
  alt_text: string | null
  
  // Search
  searchable_text: string | null
  
  // Source tracking
  uploaded_by: string | null
  source: "upload" | "camera" | "voice_note" | "import" | "migration"
  
  // Audit
  created_at: string
  updated_at: string
}

// Venue Media - Links media to venues with context
export interface VenueMediaLink {
  id: string
  venue_id: string
  media_id: string
  
  // Context
  context: VenueMediaContext
  display_order: number
  is_primary: boolean
  
  // Optional caption
  caption: string | null
  
  // Visibility
  show_on_tour: boolean
  show_on_public: boolean
  
  created_at: string
  updated_at: string
  
  // Relations
  media?: MediaLibraryItem
}

// Asset Media - Links media to sales assets (versioned)
export interface AssetMediaLink {
  id: string
  asset_id: string
  media_id: string
  
  // Role
  role: string // 'primary', 'thumbnail', 'page_1', etc.
  language: string
  
  // Versioning
  version: number
  is_current: boolean
  
  created_at: string
  updated_at: string
  
  // Relations
  media?: MediaLibraryItem
}

// Visit Captures - Enhanced with media library
export interface VisitCaptureEnhanced {
  id: string
  visit_stop_id: string
  media_id: string
  
  // Capture details
  capture_type: CaptureTypeExtended
  captured_by: string | null
  captured_at: string
  
  // Voice notes
  transcript: string | null
  transcript_summary: string | null
  sentiment: SentimentExtended | null
  
  // Annotations
  annotation_text: string | null
  annotation_emoji: string | null
  
  // Location
  location_hint: string | null
  
  // Flags
  is_client_visible: boolean
  is_highlighted: boolean
  include_in_recap: boolean
  
  created_at: string
  
  // Relations
  media?: MediaLibraryItem
}

// PDF Extractions - Structured data from PDFs
export interface PDFExtraction {
  id: string
  media_id: string
  
  // Page data
  page_number: number
  page_thumbnail_path: string | null
  page_text: string | null
  
  // Extracted tables
  tables: {
    name?: string
    headers: string[]
    rows: string[][]
  }[]
  
  // Content type
  content_type: "text" | "table" | "image" | "diagram" | "floorplan" | null
  
  created_at: string
}

// Media Collections - Group media for easy access
export interface MediaCollection {
  id: string
  property_id: string
  
  name: string
  description: string | null
  cover_media_id: string | null
  
  // Smart collections
  is_smart_collection: boolean
  smart_filter: {
    file_type?: NewMediaFileType
    tags?: string[]
  } | null
  
  created_at: string
  updated_at: string
  
  // Relations
  cover_media?: MediaLibraryItem
}

export interface MediaCollectionItem {
  collection_id: string
  media_id: string
  display_order: number
  created_at: string
  
  // Relations
  media?: MediaLibraryItem
}

// ============================================
// Helper Types for UI Components
// ============================================

// Upload state for MediaUploadZone
export type UploadState = 
  | { status: "pending" }
  | { status: "uploading"; progress: number }
  | { status: "processing"; step: string }
  | { status: "complete"; mediaId: string; thumbnail: string }
  | { status: "error"; message: string }

export interface MediaUploadFile {
  file: File
  id: string // temp ID
  state: UploadState
}

// Media picker selection
export interface MediaPickerSelection {
  mediaId: string
  media: MediaLibraryItem
}

// Grouped venue media by context
export interface VenueMediaByContext {
  context: VenueMediaContext
  media: (VenueMediaLink & { media: MediaLibraryItem })[]
}

// Search filters for media picker
export interface MediaSearchFilters {
  query?: string
  fileTypes?: NewMediaFileType[]
  tags?: string[]
  status?: MediaStatus[]
}

// Extended Venue with media relations
export interface VenueWithMedia extends Venue {
  media_by_context?: VenueMediaByContext[]
  hero_image?: MediaLibraryItem
  gallery_images?: MediaLibraryItem[]
  floorplans?: MediaLibraryItem[]
  capacity_charts?: MediaLibraryItem[]
}
