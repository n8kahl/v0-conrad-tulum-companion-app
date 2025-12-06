"use client"

import type React from "react"

import type { Asset } from "@/lib/supabase/types"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Video, ImageIcon, Globe, Layout } from "lucide-react"

const assetTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  flipbook: Layout,
  image: ImageIcon,
  video: Video,
  virtual_tour: Globe,
  diagram: Layout,
}

const categoryColors: Record<string, string> = {
  sales: "bg-primary/10 text-primary",
  weddings: "bg-pink-100 text-pink-700",
  spa: "bg-teal-100 text-teal-700",
  events: "bg-amber-100 text-amber-700",
  marketing: "bg-blue-100 text-blue-700",
}

interface AssetGridProps {
  assets: Asset[]
}

export function AssetGrid({ assets }: AssetGridProps) {
  if (assets.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium text-foreground">No assets found</h3>
        <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters or add a new asset.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {assets.map((asset) => {
        const TypeIcon = assetTypeIcons[asset.asset_type] || FileText
        return (
          <Link key={asset.id} href={`/admin/assets/${asset.id}`}>
            <Card className="group overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
              {/* Thumbnail */}
              <div className="relative aspect-[4/3] bg-muted">
                {asset.thumbnail_url ? (
                  <Image
                    src={asset.thumbnail_url || "/placeholder.svg"}
                    alt={asset.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TypeIcon className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
                {/* Type Badge */}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
                    {asset.asset_type.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4">
                <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {asset.name}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className={`text-xs ${categoryColors[asset.category] || "bg-muted text-muted-foreground"}`}>
                    {asset.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground uppercase">{asset.language}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
