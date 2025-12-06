"use client"

import { useEffect, useRef } from "react"
import { useLanguage } from "@/lib/contexts/language-context"

/**
 * Hook to track asset views
 * Only tracks once per asset per session
 */
export function useTrackView(assetId: string | null) {
  const { locale } = useLanguage()
  const trackedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!assetId) return

    // Don't track if already tracked this session
    if (trackedRef.current.has(assetId)) return

    // Mark as tracked immediately to prevent duplicate calls
    trackedRef.current.add(assetId)

    // Send analytics in background
    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId, language: locale }),
    }).catch((error) => {
      // Silently fail - analytics shouldn't break the app
      console.error("Failed to track view:", error)
    })
  }, [assetId, locale])
}
