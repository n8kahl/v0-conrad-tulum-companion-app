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

export type MediaFileType = "image" | "video" | "audio" | "document"
export type MediaSource = "upload" | "capture" | "ai_generated"
export type CaptureType = "photo" | "voice_note" | "video"
export type Sentiment = "positive" | "neutral" | "negative"
export type AnnotationType = "reaction" | "question" | "concern" | "highlight" | "note"
export type MediaContext = "hero" | "gallery" | "floorplan" | "menu" | "capacity_chart"
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
