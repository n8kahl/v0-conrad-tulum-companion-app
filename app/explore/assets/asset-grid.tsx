"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/lib/contexts/language-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Video,
  ImageIcon,
  Globe,
  Layout,
  Map,
  Search,
  X,
} from "lucide-react"

interface Asset {
  id: string
  name: string
  asset_type: string
  category: string
  language: string
  thumbnail_url: string | null
  description: string | null
}

interface AssetGridProps {
  assets: Asset[]
  categories: string[]
  assetTypes: string[]
}

const assetTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  flipbook: Layout,
  image: ImageIcon,
  video: Video,
  virtual_tour: Globe,
  diagram: Map,
}

export function AssetGrid({ assets, categories, assetTypes }: AssetGridProps) {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  // Filter assets based on search and filters
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          asset.name.toLowerCase().includes(query) ||
          asset.description?.toLowerCase().includes(query) ||
          asset.category.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Category filter
      if (selectedCategory && asset.category !== selectedCategory) {
        return false
      }

      // Type filter
      if (selectedType && asset.asset_type !== selectedType) {
        return false
      }

      return true
    })
  }, [assets, searchQuery, selectedCategory, selectedType])

  const hasActiveFilters = searchQuery || selectedCategory || selectedType

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory(null)
    setSelectedType(null)
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="space-y-4 mb-8">
        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {/* Category Chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category ? null : category
                  )
                }
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Divider */}
          {categories.length > 0 && assetTypes.length > 0 && (
            <div className="w-px bg-border self-stretch" />
          )}

          {/* Type Chips */}
          <div className="flex flex-wrap gap-2">
            {assetTypes.map((type) => {
              const TypeIcon = assetTypeIcons[type] || FileText
              return (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setSelectedType(selectedType === type ? null : type)
                  }
                  className="capitalize gap-1.5"
                >
                  <TypeIcon className="h-3.5 w-3.5" />
                  {type.replace("_", " ")}
                </Button>
              )
            })}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              {t("clearFilters")}
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground mb-4">
        {t("showing")} {filteredAssets.length} {t("of")} {assets.length}{" "}
        {t("materials")}
      </p>

      {/* Assets Grid */}
      {filteredAssets.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAssets.map((asset) => {
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
                    <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs capitalize">
                      {asset.asset_type.replace("_", " ")}
                    </Badge>
                  </div>

                  {/* Content */}
                  <CardContent className="p-4">
                    <h3 className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {asset.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground capitalize">
                      {asset.category}
                    </p>
                    {asset.description && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {asset.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground">{t("noResults")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noResultsDescription")}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
              {t("clearFilters")}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
