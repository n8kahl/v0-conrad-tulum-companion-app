/**
 * Asset Bundle System
 * 
 * Smart resource grouping for contextual asset recommendations.
 * Used in site visit builders, venue detail pages, and marketing sections.
 */

import { createClient } from "@/lib/supabase/server"
import type { Asset } from "@/lib/supabase/types"

export interface AssetBundleFilter {
  propertyId: string
  audience?: "event_planner" | "wedding_planner" | "corporate" | "leisure" | "spa"
  sectionSlug?: string // e.g., "meetings-spaces", "dining", "wedding-venues"
  groupType?: "featured" | "popular" | "comprehensive" | "quick-reference"
  category?: string
  assetType?: string
  limit?: number
}

export interface AssetBundle {
  title: string
  description?: string
  assets: Asset[]
  metadata?: {
    totalCount: number
    featuredCount: number
    popularCount: number
  }
}

/**
 * Fetch a curated bundle of assets based on context filters.
 * 
 * Priority sorting:
 * 1. Featured assets (tag:featured)
 * 2. Popular assets (tag:popular or high view_count)
 * 3. Manual sort_order
 * 4. Recently updated
 * 
 * @example
 * // Get meeting planning assets for corporate clients
 * const bundle = await fetchAssetBundle({
 *   propertyId: "conrad-tulum",
 *   audience: "corporate",
 *   sectionSlug: "meetings-spaces",
 *   groupType: "featured",
 *   limit: 6
 * })
 * 
 * // Get comprehensive wedding planning resources
 * const weddingBundle = await fetchAssetBundle({
 *   propertyId: "conrad-tulum",
 *   audience: "wedding_planner",
 *   groupType: "comprehensive",
 *   limit: 12
 * })
 */
export async function fetchAssetBundle(
  filter: AssetBundleFilter
): Promise<AssetBundle> {
  const supabase = await createClient()

  // Build query with filters
  let query = supabase
    .from("assets")
    .select("*")
    .eq("property_id", filter.propertyId)
    .eq("is_active", true)

  // Apply category filter (maps to audience/section)
  if (filter.category) {
    query = query.eq("category", filter.category)
  }

  // Apply asset type filter
  if (filter.assetType) {
    query = query.eq("asset_type", filter.assetType)
  }

  // Execute query
  const { data: assets, error } = await query

  if (error) {
    console.error("Error fetching asset bundle:", error)
    return {
      title: "Resources",
      assets: [],
      metadata: { totalCount: 0, featuredCount: 0, popularCount: 0 },
    }
  }

  if (!assets) {
    return {
      title: "Resources",
      assets: [],
      metadata: { totalCount: 0, featuredCount: 0, popularCount: 0 },
    }
  }

  // Filter by tags (featured, popular, audience-specific)
  let filteredAssets = [...assets]

  // Audience tag mapping
  const audienceTags: Record<string, string[]> = {
    event_planner: ["meetings", "corporate", "events"],
    wedding_planner: ["weddings", "romance", "celebrations"],
    corporate: ["meetings", "corporate", "business"],
    leisure: ["resort", "amenities", "experiences"],
    spa: ["spa", "wellness", "relaxation"],
  }

  // Filter by audience if specified
  if (filter.audience && audienceTags[filter.audience]) {
    const relevantTags = audienceTags[filter.audience]
    filteredAssets = filteredAssets.filter((asset) =>
      asset.tags?.some((tag: string) => relevantTags.includes(tag.toLowerCase()))
    )
  }

  // Filter by section slug (matches tags or category)
  if (filter.sectionSlug) {
    const sectionKeywords = filter.sectionSlug.split("-")
    filteredAssets = filteredAssets.filter((asset) => {
      const matchesCategory = sectionKeywords.some((keyword) =>
        asset.category.toLowerCase().includes(keyword)
      )
      const matchesTags = asset.tags?.some((tag: string) =>
        sectionKeywords.some((keyword) => tag.toLowerCase().includes(keyword))
      )
      return matchesCategory || matchesTags
    })
  }

  // Count featured and popular
  const featuredCount = filteredAssets.filter((asset) =>
    asset.tags?.includes("featured")
  ).length
  const popularCount = filteredAssets.filter((asset) =>
    asset.tags?.includes("popular")
  ).length

  // Apply group type filtering
  if (filter.groupType === "featured") {
    filteredAssets = filteredAssets.filter((asset) =>
      asset.tags?.includes("featured")
    )
  } else if (filter.groupType === "popular") {
    filteredAssets = filteredAssets.filter(
      (asset) =>
        asset.tags?.includes("popular") || asset.tags?.includes("featured")
    )
  }
  // "comprehensive" and "quick-reference" use all filtered assets

  // Sort by priority
  filteredAssets.sort((a, b) => {
    // Priority 1: Featured assets first
    const aFeatured = a.tags?.includes("featured") ? 1 : 0
    const bFeatured = b.tags?.includes("featured") ? 1 : 0
    if (aFeatured !== bFeatured) return bFeatured - aFeatured

    // Priority 2: Popular assets
    const aPopular = a.tags?.includes("popular") ? 1 : 0
    const bPopular = b.tags?.includes("popular") ? 1 : 0
    if (aPopular !== bPopular) return bPopular - aPopular

    // Priority 3: Manual sort order (lower = higher priority)
    if (a.sort_order !== b.sort_order) {
      return (a.sort_order || 999) - (b.sort_order || 999)
    }

    // Priority 4: Recently updated
    return (
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  })

  // Apply limit
  if (filter.limit) {
    filteredAssets = filteredAssets.slice(0, filter.limit)
  }

  // Generate descriptive title
  let title = "Resources"
  if (filter.audience) {
    const audienceTitles = {
      event_planner: "Meeting & Event Resources",
      wedding_planner: "Wedding Planning Resources",
      corporate: "Corporate Resources",
      leisure: "Resort Experiences",
      spa: "Spa & Wellness Resources",
    }
    title = audienceTitles[filter.audience]
  } else if (filter.sectionSlug) {
    title = filter.sectionSlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return {
    title,
    description: filter.groupType
      ? `${filter.groupType.charAt(0).toUpperCase() + filter.groupType.slice(1)} assets`
      : undefined,
    assets: filteredAssets,
    metadata: {
      totalCount: assets.length,
      featuredCount,
      popularCount,
    },
  }
}

/**
 * Fetch multiple asset bundles in parallel.
 * Useful for multi-section pages or dashboards.
 * 
 * @example
 * const [meetingBundle, diningBundle, spaBundle] = await fetchAssetBundles([
 *   { propertyId: "conrad-tulum", sectionSlug: "meetings-spaces", limit: 6 },
 *   { propertyId: "conrad-tulum", sectionSlug: "dining", limit: 6 },
 *   { propertyId: "conrad-tulum", sectionSlug: "spa", limit: 6 }
 * ])
 */
export async function fetchAssetBundles(
  filters: AssetBundleFilter[]
): Promise<AssetBundle[]> {
  return Promise.all(filters.map((filter) => fetchAssetBundle(filter)))
}

/**
 * Get suggested assets for a specific venue.
 * Returns assets tagged with venue category or type.
 * 
 * @example
 * const venueAssets = await getSuggestedAssetsForVenue("grand-ballroom", "conrad-tulum")
 */
export async function getSuggestedAssetsForVenue(
  venueId: string,
  propertyId: string,
  limit: number = 6
): Promise<Asset[]> {
  const supabase = await createClient()

  // First get the venue to understand its category
  const { data: venue } = await supabase
    .from("venues")
    .select("name, venue_type, tags")
    .eq("id", venueId)
    .single()

  if (!venue) return []

  // Fetch assets that match venue characteristics
  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("property_id", propertyId)
    .eq("is_active", true)
    .limit(limit * 2) // Fetch extra for filtering

  if (!assets) return []

  // Score assets by relevance to venue
  const scoredAssets = assets
    .map((asset) => {
      let score = 0

      // Match venue type (e.g., "meeting_room" matches "meetings" category)
      if (
        venue.venue_type &&
        asset.category.toLowerCase().includes(venue.venue_type.toLowerCase())
      ) {
        score += 10
      }

      // Match venue tags
      if (venue.tags && asset.tags) {
        const matchingTags = venue.tags.filter((tag: string) =>
          asset.tags?.includes(tag)
        )
        score += matchingTags.length * 5
      }

      // Boost featured/popular
      if (asset.tags?.includes("featured")) score += 3
      if (asset.tags?.includes("popular")) score += 2

      return { asset, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scoredAssets.map((item) => item.asset)
}
