"use client"

import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/lib/contexts/language-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Star, FileText, Video, ImageIcon, Globe, Layout, Map } from "lucide-react"

interface Asset {
  id: string
  name: string
  asset_type: string
  category: string
  thumbnail_url: string | null
  description: string | null
  view_count?: number
  is_featured?: boolean
}

interface PopularAssetsProps {
  assets: Asset[]
  title?: string
  showBadge?: boolean
}

const assetTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  flipbook: Layout,
  image: ImageIcon,
  video: Video,
  virtual_tour: Globe,
  diagram: Map,
}

export function PopularAssets({ assets, title, showBadge = true }: PopularAssetsProps) {
  const { t } = useLanguage()

  if (assets.length === 0) return null

  return (
    <div>
      {title && (
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">{title}</h2>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {assets.map((asset, index) => {
          const TypeIcon = assetTypeIcons[asset.asset_type] || FileText
          return (
            <Link key={asset.id} href={`/explore/assets/${asset.id}`}>
              <Card className="group overflow-hidden transition-all hover:shadow-md hover:border-primary/20 h-full">
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] bg-muted">
                  {asset.thumbnail_url ? (
                    <Image
                      src={asset.thumbnail_url}
                      alt={asset.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <TypeIcon className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  {showBadge && (
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      {asset.is_featured && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      )}
                      {!asset.is_featured && index < 3 && (
                        <Badge className="bg-background/80 backdrop-blur-sm text-xs">
                          #{index + 1}
                        </Badge>
                      )}
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
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground capitalize">{asset.category}</p>
                    {asset.view_count !== undefined && asset.view_count > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {asset.view_count} views
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
