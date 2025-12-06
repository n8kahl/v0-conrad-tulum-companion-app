"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/lib/contexts/language-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  X,
  FileText,
  Layout,
  Video,
  Globe,
  Image as ImageIcon,
  Map,
} from "lucide-react"
import { cn } from "@/lib/utils"

const assetTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  flipbook: Layout,
  image: ImageIcon,
  video: Video,
  virtual_tour: Globe,
  diagram: Map,
}

interface ContentSearchProps {
  categories: string[]
  assetTypes: string[]
  className?: string
  onSearch?: (query: string) => void
  onCategoryChange?: (category: string | null) => void
  onTypeChange?: (type: string | null) => void
  variant?: "inline" | "page"
}

export function ContentSearch({
  categories,
  assetTypes,
  className,
  onSearch,
  onCategoryChange,
  onTypeChange,
  variant = "page",
}: ContentSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category") || null
  )
  const [selectedType, setSelectedType] = useState<string | null>(
    searchParams.get("type") || null
  )

  const updateUrl = useCallback(
    (newQuery: string, newCategory: string | null, newType: string | null) => {
      const params = new URLSearchParams()
      if (newQuery) params.set("q", newQuery)
      if (newCategory) params.set("category", newCategory)
      if (newType) params.set("type", newType)

      const url = params.toString()
        ? `/explore/search?${params.toString()}`
        : "/explore/search"
      router.push(url)
    },
    [router]
  )

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value)
      if (variant === "page") {
        updateUrl(value, selectedCategory, selectedType)
      }
      onSearch?.(value)
    },
    [variant, selectedCategory, selectedType, updateUrl, onSearch]
  )

  const handleCategorySelect = useCallback(
    (category: string) => {
      const newCategory = selectedCategory === category ? null : category
      setSelectedCategory(newCategory)
      if (variant === "page") {
        updateUrl(query, newCategory, selectedType)
      }
      onCategoryChange?.(newCategory)
    },
    [variant, query, selectedCategory, selectedType, updateUrl, onCategoryChange]
  )

  const handleTypeSelect = useCallback(
    (type: string) => {
      const newType = selectedType === type ? null : type
      setSelectedType(newType)
      if (variant === "page") {
        updateUrl(query, selectedCategory, newType)
      }
      onTypeChange?.(newType)
    },
    [variant, query, selectedCategory, selectedType, updateUrl, onTypeChange]
  )

  const clearAll = useCallback(() => {
    setQuery("")
    setSelectedCategory(null)
    setSelectedType(null)
    if (variant === "page") {
      router.push("/explore/search")
    }
    onSearch?.("")
    onCategoryChange?.(null)
    onTypeChange?.(null)
  }, [variant, router, onSearch, onCategoryChange, onTypeChange])

  const hasFilters = query || selectedCategory || selectedType

  const categoryLabels: Record<string, string> = useMemo(
    () => ({
      sales: t("sales"),
      weddings: t("weddings"),
      spa: t("spa"),
      events: t("events"),
      marketing: t("marketing"),
    }),
    [t]
  )

  const typeLabels: Record<string, string> = useMemo(
    () => ({
      pdf: t("pdf"),
      flipbook: t("flipbook"),
      image: t("image"),
      video: t("video"),
      virtual_tour: t("virtual_tour"),
      diagram: t("diagram"),
    }),
    [t]
  )

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t("search")}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-10 h-12 text-base rounded-xl border-border/50 focus:border-primary"
        />
        {query && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="space-y-3">
        {/* Category Chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  "touch-manipulation select-none",
                  "border border-border/50",
                  "hover:border-primary/50 hover:bg-primary/5",
                  "active:scale-95",
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground"
                )}
              >
                {categoryLabels[category] || category}
              </button>
            ))}
          </div>
        )}

        {/* Type Chips */}
        {assetTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {assetTypes.map((type) => {
              const Icon = assetTypeIcons[type] || FileText
              return (
                <button
                  key={type}
                  onClick={() => handleTypeSelect(type)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    "touch-manipulation select-none",
                    "border border-border/50",
                    "hover:border-primary/50 hover:bg-primary/5",
                    "active:scale-95",
                    "flex items-center gap-2",
                    selectedType === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {typeLabels[type] || type.replace("_", " ")}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 flex-wrap">
            {query && (
              <Badge variant="secondary" className="gap-1">
                &ldquo;{query}&rdquo;
                <button
                  onClick={() => handleSearch("")}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1 capitalize">
                {categoryLabels[selectedCategory] || selectedCategory}
                <button
                  onClick={() => handleCategorySelect(selectedCategory)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedType && (
              <Badge variant="secondary" className="gap-1 capitalize">
                {typeLabels[selectedType] || selectedType.replace("_", " ")}
                <button
                  onClick={() => handleTypeSelect(selectedType)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-muted-foreground hover:text-foreground"
          >
            {t("clearAll")}
          </Button>
        </div>
      )}
    </div>
  )
}
