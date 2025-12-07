import type { Venue, VenueMedia, VisitCapture } from "@/lib/supabase/types"

/**
 * Picks the best hero image for a venue in the recap.
 * Priority: Tour captures > Venue hero media > Legacy venue images
 */
export function pickRecapHeroForVenue(args: {
  venue: Venue & { venue_media?: VenueMedia[] }
  captures: VisitCapture[]
}): { heroUrl: string | null; from: "capture" | "venue" | "legacy" } {
  // First priority: Latest tour photo capture
  const photoCapture = args.captures
    .filter(c => c.capture_type === "photo" && c.media?.storage_path)
    .sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime())[0]

  if (photoCapture?.media?.storage_path) {
    // Check if storage_path is already a full URL
    if (photoCapture.media.storage_path.startsWith("http")) {
      return {
        heroUrl: photoCapture.media.storage_path,
        from: "capture",
      }
    }
    
    return {
      heroUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${photoCapture.media.storage_path}`,
      from: "capture",
    }
  }

  // Second priority: Venue hero from media_library
  const heroMedia = args.venue.venue_media?.find(vm => vm.context === "hero")
  
  if (heroMedia?.media?.storage_path) {
    // Check if storage_path is already a full URL
    if (heroMedia.media.storage_path.startsWith("http")) {
      return {
        heroUrl: heroMedia.media.storage_path,
        from: "venue",
      }
    }
    
    return {
      heroUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${heroMedia.media.storage_path}`,
      from: "venue",
    }
  }

  // Last resort: Legacy venue.images field
  return {
    heroUrl: args.venue.images?.[0] || null,
    from: "legacy",
  }
}

/**
 * Computes capture statistics for a venue in the recap.
 * Returns counts of photos, notes, and reactions.
 */
export function computeVenueRecapStats(args: { 
  captures: VisitCapture[]
  isFavorited: boolean
}) {
  const photoCount = args.captures.filter(c => c.capture_type === "photo").length
  
  const noteCount = args.captures.filter(c => 
    c.capture_type === "voice_note" || 
    (c.caption && c.capture_type !== "photo" && !isEmojiOnly(c.caption))
  ).length
  
  const reactionCount = args.captures.filter(c => 
    c.caption && isEmojiOnly(c.caption)
  ).length

  return {
    photoCount,
    noteCount,
    reactionCount,
    isFavorited: args.isFavorited,
    hasCaptures: photoCount > 0 || noteCount > 0,
  }
}

/**
 * Helper to detect if a string is emoji-only
 */
function isEmojiOnly(text: string): boolean {
  // Remove all emoji characters and check if anything remains
  const withoutEmoji = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()
  return withoutEmoji.length === 0 && text.trim().length > 0
}

/**
 * Gets all tour photos captured for a venue
 */
export function getVenueTourPhotos(captures: VisitCapture[]): VisitCapture[] {
  return captures
    .filter(c => c.capture_type === "photo" && c.media?.storage_path)
    .sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime())
}

/**
 * Gets all notes and voice notes for a venue
 */
export function getVenueNotes(captures: VisitCapture[]): VisitCapture[] {
  return captures
    .filter(c => 
      c.capture_type === "voice_note" || 
      (c.caption && !isEmojiOnly(c.caption))
    )
    .sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime())
}
