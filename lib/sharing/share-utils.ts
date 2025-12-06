/**
 * Sharing utilities for Conrad Tulum Content Hub
 */

export interface ShareData {
  title: string
  text?: string
  url: string
}

/**
 * Check if Web Share API is available
 */
export function canUseWebShare(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share
}

/**
 * Share using native Web Share API or fallback to clipboard
 */
export async function shareContent(data: ShareData): Promise<{ success: boolean; method: "native" | "clipboard" }> {
  if (canUseWebShare()) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      })
      return { success: true, method: "native" }
    } catch (error) {
      // User cancelled or error - fall through to clipboard
      if ((error as Error).name === "AbortError") {
        return { success: false, method: "native" }
      }
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(data.url)
    return { success: true, method: "clipboard" }
  } catch {
    return { success: false, method: "clipboard" }
  }
}

/**
 * Generate a shareable URL for an asset
 */
export function getAssetShareUrl(assetId: string, locale?: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const url = new URL(`/explore/assets/${assetId}`, baseUrl)
  if (locale) {
    url.searchParams.set("lang", locale)
  }
  return url.toString()
}

/**
 * Generate a shareable URL for a collection
 */
export function getCollectionShareUrl(collectionId: string, locale?: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const url = new URL(`/explore/collections/${collectionId}`, baseUrl)
  if (locale) {
    url.searchParams.set("lang", locale)
  }
  return url.toString()
}

/**
 * Generate a shareable URL for a search
 */
export function getSearchShareUrl(query: string, category?: string, type?: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const url = new URL("/explore/search", baseUrl)
  if (query) url.searchParams.set("q", query)
  if (category) url.searchParams.set("category", category)
  if (type) url.searchParams.set("type", type)
  return url.toString()
}
