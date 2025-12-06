"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Video, ImageIcon, Globe, Layout } from "lucide-react"

const assetTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  flipbook: Layout,
  image: ImageIcon,
  video: Video,
  virtual_tour: Globe,
  diagram: Layout,
}

// Minimal asset type required for carousel display
interface CarouselAsset {
  id: string
  name: string
  asset_type: string
  category: string
  thumbnail_url: string | null
  description?: string | null
}

interface AssetCarouselProps {
  assets: CarouselAsset[]
}

export function AssetCarousel({ assets }: AssetCarouselProps) {
  return (
    <div className="relative -mx-6 px-6">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory">
        {assets.map((asset) => {
          const TypeIcon = assetTypeIcons[asset.asset_type] || FileText
          return (
            <Link key={asset.id} href={`/explore/assets/${asset.id}`} className="flex-shrink-0 w-[260px] snap-start">
              <Card className="group overflow-hidden transition-all hover:shadow-md hover:border-primary/20 h-full">
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
                      <TypeIcon className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs capitalize">
                    {asset.asset_type.replace("_", " ")}
                  </Badge>
                </div>

                {/* Content */}
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {asset.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground capitalize">{asset.category}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
