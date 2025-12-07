"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, CheckSquare, Square, X, Folder } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Collection } from "@/lib/supabase/types"
import Image from "next/image"

interface CollectionPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (collectionIds: string[]) => void
  propertyId?: string
  multiSelect?: boolean
  initialSelection?: string[]
  excludeIds?: string[] // Collections to exclude from picker
}

export function CollectionPicker({
  isOpen,
  onClose,
  onSelect,
  propertyId,
  multiSelect = true,
  initialSelection = [],
  excludeIds = [],
}: CollectionPickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelection))
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch collections
  useEffect(() => {
    if (!isOpen) return

    const fetchCollections = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (propertyId) params.set("property_id", propertyId)
        params.set("is_active", "true")

        const response = await fetch(`/api/collections?${params.toString()}`)
        if (!response.ok) throw new Error("Failed to fetch collections")
        
        const data = await response.json()
        // Filter out excluded IDs
        const filtered = (data.collections || []).filter(
          (c: Collection) => !excludeIds.includes(c.id)
        )
        setCollections(filtered)
      } catch (error) {
        console.error("Failed to fetch collections:", error)
        setCollections([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCollections()
  }, [isOpen, propertyId, excludeIds])

  // Filter collections by search query
  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections

    const query = searchQuery.toLowerCase()
    return collections.filter(
      (collection) =>
        collection.name.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query)
    )
  }, [collections, searchQuery])

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
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Select Collections</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 py-4 border-b space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

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
                <p className="text-sm text-muted-foreground">Loading collections...</p>
              </div>
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Folder className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium">No collections found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery ? "Try a different search term" : "Create collections first"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
              {filteredCollections.map((collection) => {
                const isSelected = selectedIds.has(collection.id)
                const assetCount = Array.isArray(collection.asset_ids)
                  ? collection.asset_ids.length
                  : 0

                return (
                  <button
                    key={collection.id}
                    onClick={() => handleSelect(collection.id)}
                    className={cn(
                      "group relative flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    )}
                  >
                    {/* Selection indicator */}
                    <div className="pt-1">
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Cover image */}
                    {collection.cover_image_url ? (
                      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                        <Image
                          src={collection.cover_image_url}
                          alt={collection.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Folder className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate mb-1">
                        {collection.name}
                      </h4>
                      {collection.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {collection.description}
                        </p>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {assetCount} {assetCount === 1 ? "asset" : "assets"}
                      </Badge>
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
