"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, Filter, Grid3x3, List, CheckSquare, Square, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { MediaLibraryItem, NewMediaFileType, MediaSearchFilters } from "@/lib/supabase/types"

interface MediaPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (mediaIds: string[]) => void
  propertyId?: string
  allowedTypes?: NewMediaFileType[]
  multiSelect?: boolean
  contextFilter?: {
    venueId?: string
    assetId?: string
  }
  initialSelection?: string[]
}

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  propertyId,
  allowedTypes,
  multiSelect = true,
  contextFilter,
  initialSelection = [],
}: MediaPickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelection))
  const [items, setItems] = useState<MediaLibraryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MediaLibraryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedType, setSelectedType] = useState<NewMediaFileType | "all">("all")

  // Fetch media items
  useEffect(() => {
    if (!isOpen) return

    const fetchMedia = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.set("query", searchQuery)
        if (propertyId) params.set("propertyId", propertyId)
        if (allowedTypes?.length) {
          params.set("fileTypes", allowedTypes.join(","))
        }

        const response = await fetch(`/api/media/search?${params.toString()}`)
        const data = await response.json()
        setItems(data.items || [])
      } catch (error) {
        console.error("Failed to fetch media:", error)
        setItems([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMedia()
  }, [isOpen, searchQuery, propertyId, allowedTypes])

  // Filter items by type
  useEffect(() => {
    if (selectedType === "all") {
      setFilteredItems(items)
    } else {
      setFilteredItems(items.filter((item) => item.file_type === selectedType))
    }
  }, [items, selectedType])

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
    onClose()
  }

  const handleClear = () => {
    setSelectedIds(new Set())
  }

  // Calculate type counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: items.length,
    }
    items.forEach((item) => {
      counts[item.file_type] = (counts[item.file_type] || 0) + 1
    })
    return counts
  }, [items])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Select Media</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 py-4 border-b space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by filename, alt text, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between">
            <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
              <TabsList>
                <TabsTrigger value="all">
                  All ({typeCounts.all || 0})
                </TabsTrigger>
                {allowedTypes?.map((type) => (
                  <TabsTrigger key={type} value={type}>
                    {type} ({typeCounts[type] || 0})
                  </TabsTrigger>
                )) || (
                  <>
                    <TabsTrigger value="image">
                      Images ({typeCounts.image || 0})
                    </TabsTrigger>
                    <TabsTrigger value="pdf">
                      PDFs ({typeCounts.pdf || 0})
                    </TabsTrigger>
                    <TabsTrigger value="video">
                      Videos ({typeCounts.video || 0})
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selection Info */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-primary/10 px-4 py-2 rounded">
              <span className="text-sm font-medium">
                {selectedIds.size} selected
              </span>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Media Grid */}
        <ScrollArea className="flex-1 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Loading media...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-gray-500 mb-2">No media found</p>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-4 gap-4 pb-4">
              {filteredItems.map((item) => (
                <MediaGridItem
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.has(item.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filteredItems.map((item) => (
                <MediaListItem
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.has(item.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
          >
            Select {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface MediaGridItemProps {
  item: MediaLibraryItem
  isSelected: boolean
  onSelect: (id: string) => void
}

function MediaGridItem({ item, isSelected, onSelect }: MediaGridItemProps) {
  const thumbnailUrl = item.thumbnail_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${item.thumbnail_path}`
    : null

  return (
    <div
      onClick={() => onSelect(item.id)}
      className={cn(
        "relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all",
        "border-2",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-transparent hover:border-gray-300"
      )}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={item.alt_text || item.original_filename}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-400">
            {item.file_type.toUpperCase()}
          </span>
        </div>
      )}

      {/* Selection Indicator */}
      <div
        className={cn(
          "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors",
          isSelected ? "bg-primary text-white" : "bg-white/80 text-gray-600"
        )}
      >
        {isSelected ? (
          <CheckSquare className="h-4 w-4" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </div>

      {/* Tags */}
      {(item.ai_tags.length > 0 || item.custom_tags.length > 0) && (
        <div className="absolute bottom-2 left-2 flex gap-1">
          {[...item.custom_tags, ...item.ai_tags].slice(0, 2).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

interface MediaListItemProps {
  item: MediaLibraryItem
  isSelected: boolean
  onSelect: (id: string) => void
}

function MediaListItem({ item, isSelected, onSelect }: MediaListItemProps) {
  const thumbnailUrl = item.thumbnail_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${item.thumbnail_path}`
    : null

  return (
    <div
      onClick={() => onSelect(item.id)}
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all",
        "border",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={item.alt_text || item.original_filename}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs font-bold text-gray-400">
              {item.file_type.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.original_filename}</p>
        {item.alt_text && (
          <p className="text-sm text-gray-500 truncate">{item.alt_text}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {item.file_type}
          </Badge>
          {item.file_size_bytes && (
            <span className="text-xs text-gray-400">
              {(item.file_size_bytes / 1024 / 1024).toFixed(1)} MB
            </span>
          )}
        </div>
      </div>

      {/* Selection Indicator */}
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
          isSelected ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
        )}
      >
        {isSelected ? (
          <CheckSquare className="h-4 w-4" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </div>
    </div>
  )
}
