/**
 * AssetBundleStrip Component
 * 
 * Horizontal scrollable strip of curated assets.
 * Used for contextual resource recommendations in:
 * - Site visit builders (suggested materials per venue)
 * - Venue detail pages (related resources)
 * - Admin dashboards (quick access to popular content)
 * 
 * Features:
 * - Horizontal scroll with snap points
 * - Compact asset cards
 * - Section title and view all link
 * - Loading and empty states
 */

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { AssetCard } from "@/components/public/asset-card"
import type { Asset } from "@/lib/supabase/types"

interface AssetBundleStripProps {
  title: string
  description?: string
  assets: Asset[]
  viewAllHref?: string // Link to full asset list (e.g., /explore/assets?category=meetings)
  emptyMessage?: string
  className?: string
}

export function AssetBundleStrip({
  title,
  description,
  assets,
  viewAllHref,
  emptyMessage = "No resources available",
  className = "",
}: AssetBundleStripProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
        {viewAllHref && assets.length > 0 && (
          <Link href={viewAllHref}>
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </div>

      {/* Asset Strip */}
      {assets.length > 0 ? (
        <div className="relative -mx-6 px-6">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex-shrink-0 w-[280px] snap-start"
              >
                <AssetCard asset={asset} variant="compact" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8 px-4 border border-dashed rounded-lg bg-muted/20">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      )}
    </div>
  )
}

/**
 * Loading skeleton for AssetBundleStrip
 */
export function AssetBundleStripSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-8 w-20 bg-muted rounded animate-pulse" />
      </div>

      {/* Asset Strip Skeleton */}
      <div className="relative -mx-6 px-6">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-[280px]">
              <div className="border rounded-lg overflow-hidden">
                {/* Thumbnail skeleton */}
                <div className="aspect-[16/10] bg-muted animate-pulse" />
                {/* Content skeleton */}
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Multi-section asset bundle display.
 * Renders multiple AssetBundleStrips vertically.
 * Useful for dashboard-style layouts with categorized resources.
 */
interface AssetBundleSectionProps {
  bundles: Array<{
    title: string
    description?: string
    assets: Asset[]
    viewAllHref?: string
  }>
  className?: string
}

export function AssetBundleSections({
  bundles,
  className = "",
}: AssetBundleSectionProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {bundles.map((bundle, index) => (
        <AssetBundleStrip
          key={`${bundle.title}-${index}`}
          title={bundle.title}
          description={bundle.description}
          assets={bundle.assets}
          viewAllHref={bundle.viewAllHref}
        />
      ))}
    </div>
  )
}
