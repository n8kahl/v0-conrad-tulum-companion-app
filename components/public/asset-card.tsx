"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Video, Globe, Image as ImageIcon, BarChart3, ExternalLink } from "lucide-react"
import Image from "next/image"
import type { Asset } from "@/lib/supabase/types"

interface AssetCardProps {
  asset: Asset
  variant?: "compact" | "default"
}

// Helper to get the primary URL for the asset
function getPrimaryAssetUrl(asset: Asset): string | null {
  const { urls } = asset
  
  // Priority order based on language preference and asset type
  return (
    urls.pdf_en ||
    urls.pdf_es ||
    urls.pdf ||
    urls.flipbook_en ||
    urls.flipbook_es ||
    urls.flipbook ||
    urls.firstview ||
    urls.tour_url ||
    null
  )
}

// Helper to get icon based on asset type
function getAssetIcon(assetType: string) {
  switch (assetType) {
    case "pdf":
    case "flipbook":
      return FileText
    case "video":
      return Video
    case "virtual_tour":
      return Globe
    case "image":
      return ImageIcon
    case "diagram":
      return BarChart3
    default:
      return FileText
  }
}

// Helper to format category and type display
function formatAssetMeta(category: string, assetType: string): string {
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1)
  const typeLabel = assetType.replace("_", " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  return `${categoryLabel} · ${typeLabel}`
}

export function AssetCard({ asset, variant = "default" }: AssetCardProps) {
  const primaryUrl = getPrimaryAssetUrl(asset)
  const Icon = getAssetIcon(asset.asset_type)
  const isCompact = variant === "compact"

  const handleClick = () => {
    if (primaryUrl) {
      window.open(primaryUrl, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <Card 
      className={`group overflow-hidden transition-all hover:shadow-lg hover:border-primary/20 cursor-pointer ${
        isCompact ? "h-full" : ""
      }`}
      onClick={handleClick}
    >
      {/* Thumbnail Area */}
      <div className={`relative bg-muted overflow-hidden ${isCompact ? "aspect-square" : "aspect-[16/10]"}`}>
        {asset.thumbnail_url ? (
          <Image
            src={asset.thumbnail_url}
            alt={asset.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Video Play Overlay */}
        {asset.asset_type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity group-hover:bg-black/30">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
              <Video className="h-8 w-8 text-primary" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Virtual Tour Badge */}
        {asset.asset_type === "virtual_tour" && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary/90 backdrop-blur-sm gap-1">
              <Globe className="h-3 w-3" />
              360° Tour
            </Badge>
          </div>
        )}

        {/* Featured Badge */}
        {asset.tags?.includes("featured") && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-amber-500/90 backdrop-blur-sm text-white">
              Featured
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className={isCompact ? "p-3" : "p-4"}>
        <div className="space-y-2">
          {/* Category & Type */}
          <div className="text-xs text-muted-foreground">
            {formatAssetMeta(asset.category, asset.asset_type)}
          </div>

          {/* Asset Name */}
          <h3 className={`font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 ${
            isCompact ? "text-sm" : "text-base"
          }`}>
            {asset.name}
          </h3>

          {/* Description (non-compact only) */}
          {!isCompact && asset.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {asset.description}
            </p>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-primary hover:text-primary"
              onClick={(e) => {
                e.stopPropagation()
                handleClick()
              }}
            >
              <span className={isCompact ? "text-xs" : "text-sm"}>View</span>
              <ExternalLink className="h-3 w-3" />
            </Button>

            {/* View count (if we track it in future) */}
            {asset.tags?.includes("popular") && !isCompact && (
              <Badge variant="secondary" className="text-xs">
                Popular
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
