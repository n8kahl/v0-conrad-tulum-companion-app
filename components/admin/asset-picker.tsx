"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, CheckSquare, Square, FileText, Image as ImageIcon, Video, Globe, Layout } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Asset } from "@/lib/supabase/types"
import Image from "next/image"

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

interface AssetPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (assetIds: string[]) => void
  propertyId?: string
  multiSelect?: boolean
  initialSelection?: string[]
  excludeIds?: string[] // Assets to exclude from picker
  categoryFilter?: string // Filter by specific category
}

export function AssetPicker({
  isOpen,
  onClose,
  onSelect,
  propertyId,
  multiSelect = true,
  initialSelection = [],
  excludeIds = [],
  categoryFilter,
}: AssetPickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelection))
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Fetch assets
  useEffect(() => {
    if (!isOpen) return

    const fetchAssets = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (propertyId) params.set("property_id", propertyId)
        params.set("is_active", "true")
        if (categoryFilter) params.set("category", categoryFilter)

        const response = await fetch(`/api/assets?${params.toString()}`)
        if (!response.ok) throw new Error("Failed to fetch assets")
        
        const data = await response.json()
        // Filter out excluded IDs
        const filtered = (data.assets || []).filter(
          (a: Asset) => !excludeIds.includes(a.id)
        )
        setAssets(filtered)
      } catch (error) {
        console.error("Failed to fetch assets:", error)
        setAssets([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssets()
  }, [isOpen, propertyId, excludeIds, categoryFilter])

  // Filter assets by search query and category
  const filteredAssets = useMemo(() => {
    let filtered = assets

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((asset) => asset.category === selectedCategory)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (asset) =>
          asset.name.toLowerCase().includes(query) ||
          asset.description?.toLowerCase().includes(query) ||
          asset.tags?.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [assets, searchQuery, selectedCategory])

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: assets.length,
    }
    assets.forEach((asset) => {
      counts[asset.category] = (counts[asset.category] || 0) + 1
    })
    return counts
  }, [assets])

  const handleSelect = (id: string) => {
    if (multiSelect) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    } else {
      setSelectedIds(new Set([id]))
    }
  }

  const handleConfirm = () => {
    onSelect(Array.from(selectedIds))
    setSelectedIds(new Set())
    setSearchQuery("")
    onClose()
  }

  const handleCancel = () => {
    setSelectedIds(new Set(initialSelection))
    setSearchQuery("")
    onClose()
  }

  const handleClear = () => {
    setSelectedIds(new Set())
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Select Assets</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 py-4 border-b space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category tabs */}
          {!categoryFilter && (
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList>
                <TabsTrigger value="all">All ({categoryCounts.all || 0})</TabsTrigger>
                <TabsTrigger value="sales">Sales ({categoryCounts.sales || 0})</TabsTrigger>
                <TabsTrigger value="weddings">Weddings ({categoryCounts.weddings || 0})</TabsTrigger>
                <TabsTrigger value="events">Events ({categoryCounts.events || 0})</TabsTrigger>
                <TabsTrigger value="spa">Spa ({categoryCounts.spa || 0})</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Selection count */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 text-xs"
              >
                Clear selection
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading assets...</p>
              </div>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium">No assets found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery ? "Try a different search term" : "Create assets first"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-4">
              {filteredAssets.map((asset) => {
                const isSelected = selectedIds.has(asset.id)
                const TypeIcon = assetTypeIcons[asset.asset_type] || FileText

                return (
                  <button
                    key={asset.id}
                    onClick={() => handleSelect(asset.id)}
                    className={cn(
                      "group relative flex flex-col rounded-lg border-2 text-left transition-all overflow-hidden",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    )}
                  >
                    {/* Selection indicator */}
                    <div className="absolute top-2 left-2 z-10">
                      {isSelected ? (
                        <div className="rounded-full bg-primary p-1">
                          <CheckSquare className="h-4 w-4 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="rounded-full bg-background/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Square className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Thumbnail */}
                    <div className="relative aspect-[4/3] bg-muted">
                      {asset.thumbnail_url ? (
                        <Image
                          src={asset.thumbnail_url}
                          alt={asset.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <TypeIcon className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      {/* Type badge */}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
                          {asset.asset_type.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <h4 className="font-medium text-sm truncate mb-1">
                        {asset.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-xs",
                            categoryColors[asset.category] || "bg-muted text-muted-foreground"
                          )}
                        >
                          {asset.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground uppercase">
                          {asset.language}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="bg-primary hover:bg-primary/90"
          >
            Add {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
