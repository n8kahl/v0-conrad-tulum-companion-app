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
