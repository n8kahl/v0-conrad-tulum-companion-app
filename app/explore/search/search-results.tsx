"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
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
  ArrowLeft,
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

interface SearchResultsProps {
  initialAssets: Asset[]
  initialQuery: string
  initialCategory: string
  initialType: string
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

export function SearchResults({
  initialAssets,
  initialQuery,
  initialCategory,
  initialType,
  categories,
  assetTypes,
}: SearchResultsProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCategory || null
  )
  const [selectedType, setSelectedType] = useState<string | null>(
    initialType || null
  )

  // Update URL with search params
  const updateSearch = useCallback(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (selectedCategory) params.set("category", selectedCategory)
    if (selectedType) params.set("type", selectedType)

    router.push(`/explore/search?${params.toString()}`)
  }, [router, searchQuery, selectedCategory, selectedType])

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateSearch()
  }

  // Handle filter changes
  const handleCategoryChange = (category: string) => {
    const newCategory = selectedCategory === category ? null : category
    setSelectedCategory(newCategory)
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (newCategory) params.set("category", newCategory)
    if (selectedType) params.set("type", selectedType)
    router.push(`/explore/search?${params.toString()}`)
  }

  const handleTypeChange = (type: string) => {
    const newType = selectedType === type ? null : type
    setSelectedType(newType)
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (selectedCategory) params.set("category", selectedCategory)
    if (newType) params.set("type", newType)
    router.push(`/explore/search?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory(null)
    setSelectedType(null)
    router.push("/explore/search")
  }

  const hasActiveFilters = searchQuery || selectedCategory || selectedType

  return (
    <div>
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/explore">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToLibrary")}
        </Link>
      </Button>

      {/* Search Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl md:text-3xl font-light text-foreground mb-6">
          {t("search").replace("...", "")}
        </h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-lg"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("")
                  const params = new URLSearchParams()
                  if (selectedCategory) params.set("category", selectedCategory)
                  if (selectedType) params.set("type", selectedType)
                  router.push(`/explore/search?${params.toString()}`)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {/* Category Chips */}
            {categories.map((category) => (
              <Button
                key={category}
                type="button"
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}

            {/* Divider */}
            {categories.length > 0 && assetTypes.length > 0 && (
              <div className="w-px bg-border self-stretch" />
            )}

            {/* Type Chips */}
            {assetTypes.map((type) => {
              const TypeIcon = assetTypeIcons[type] || FileText
              return (
                <Button
                  key={type}
                  type="button"
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTypeChange(type)}
                  className="capitalize gap-1.5"
                >
                  <TypeIcon className="h-3.5 w-3.5" />
                  {type.replace("_", " ")}
                </Button>
              )
            })}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                type="button"
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
        </form>
      </div>

      {/* Results */}
      {initialQuery || selectedCategory || selectedType ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {initialAssets.length} {t("materials")}{" "}
            {initialQuery && (
              <>
                {t("for")} &ldquo;{initialQuery}&rdquo;
              </>
            )}
          </p>

          {initialAssets.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {initialAssets.map((asset) => {
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
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4"
              >
                {t("clearFilters")}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground text-lg">
            {t("search").replace("...", "")}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Search for brochures, factsheets, virtual tours, and other sales materials
          </p>
        </div>
      )}
    </div>
  )
}
