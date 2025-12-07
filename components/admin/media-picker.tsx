"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Search,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Check,
  Upload,
  Loader2,
  Grid3X3,
  List,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { MediaLibrary, MediaFileType } from "@/lib/supabase/types"

interface MediaPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (mediaIds: string[], mediaItems: MediaLibrary[]) => void
  propertyId?: string
  selectedIds?: string[]
  maxSelections?: number
  filterType?: MediaFileType | "all"
  title?: string
}

const FILE_TYPE_ICONS: Record<MediaFileType, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  video: Video,
  document: FileText,
  audio: Music,
}

const FILE_TYPE_LABELS: Record<MediaFileType | "all", string> = {
  all: "All",
  image: "Images",
  video: "Videos",
  document: "Documents",
  audio: "Audio",
}

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  propertyId,
  selectedIds = [],
  maxSelections,
  filterType = "all",
  title = "Select Media",
}: MediaPickerProps) {
  const [media, setMedia] = useState<MediaLibrary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<MediaFileType | "all">(filterType)
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds))
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [uploading, setUploading] = useState(false)

  const supabase = createClient()

  // Fetch media from database
  useEffect(() => {
    if (!isOpen) return

    const fetchMedia = async () => {
      setLoading(true)
      try {
        let query = supabase
          .from("media_library")
          .select("*")
          .order("created_at", { ascending: false })

        if (propertyId) {
          query = query.eq("property_id", propertyId)
        }

        const { data, error } = await query

        if (error) throw error
        setMedia(data || [])
      } catch (error) {
        console.error("Failed to fetch media:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMedia()
  }, [isOpen, propertyId, supabase])

  // Reset selection when opening
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(selectedIds))
      setSearchQuery("")
      setActiveTab(filterType)
    }
  }, [isOpen, selectedIds, filterType])

  // Filter media based on search and type
  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      // Type filter
      if (activeTab !== "all" && item.file_type !== activeTab) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          item.file_name.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
        )
      }

      return true
    })
  }, [media, activeTab, searchQuery])

  const handleToggleSelect = useCallback(
    (mediaId: string) => {
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(mediaId)) {
          next.delete(mediaId)
        } else {
          if (maxSelections && next.size >= maxSelections) {
            return prev
          }
          next.add(mediaId)
        }
        return next
      })
    },
    [maxSelections]
  )

  const handleConfirm = useCallback(() => {
    const selectedArray = Array.from(selected)
    const selectedItems = media.filter((m) => selected.has(m.id))
    onSelect(selectedArray, selectedItems)
    onClose()
  }, [selected, media, onSelect, onClose])

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      setUploading(true)
      try {
        for (const file of Array.from(files)) {
          // Determine file type
          let fileType: MediaFileType = "document"
          if (file.type.startsWith("image/")) fileType = "image"
          else if (file.type.startsWith("video/")) fileType = "video"
          else if (file.type.startsWith("audio/")) fileType = "audio"

          // Upload to storage
          const fileName = `uploads/${Date.now()}-${file.name}`
          const { error: uploadError } = await supabase.storage
            .from("media-library")
            .upload(fileName, file)

          if (uploadError) {
            console.error("Upload error:", uploadError)
            continue
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("media-library")
            .getPublicUrl(fileName)

          // Create database record
          const { data: mediaRecord, error: dbError } = await supabase
            .from("media_library")
            .insert({
              property_id: propertyId,
              file_name: file.name,
              file_type: fileType,
              mime_type: file.type,
              storage_path: urlData.publicUrl,
              file_size: file.size,
              source: "upload",
              tags: [],
            })
            .select()
            .single()

          if (dbError) {
            console.error("Database error:", dbError)
            continue
          }

          // Add to local state
          if (mediaRecord) {
            setMedia((prev) => [mediaRecord, ...prev])
          }
        }
      } catch (error) {
        console.error("Upload failed:", error)
      } finally {
        setUploading(false)
        // Reset input
        e.target.value = ""
      }
    },
    [propertyId, supabase]
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              >
                {viewMode === "grid" ? (
                  <List className="h-4 w-4" />
                ) : (
                  <Grid3X3 className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search and Upload */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <Button variant="outline" disabled={uploading}>
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload
              </Button>
            </div>
          </div>

          {/* Type Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MediaFileType | "all")} className="mt-4">
            <TabsList>
              {(["all", "image", "video", "document", "audio"] as const).map((type) => (
                <TabsTrigger key={type} value={type} className="gap-1.5">
                  {type !== "all" && (
                    <span className="h-3.5 w-3.5">
                      {(() => {
                        const Icon = FILE_TYPE_ICONS[type]
                        return <Icon className="h-3.5 w-3.5" />
                      })()}
                    </span>
                  )}
                  {FILE_TYPE_LABELS[type]}
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {type === "all"
                      ? media.length
                      : media.filter((m) => m.file_type === type).length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </DialogHeader>

        {/* Media Grid */}
        <ScrollArea className="flex-1 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No media found</p>
              <p className="text-sm">Upload some files or adjust your filters</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <AnimatePresence>
                {filteredMedia.map((item) => (
                  <MediaGridItem
                    key={item.id}
                    item={item}
                    isSelected={selected.has(item.id)}
                    onToggle={() => handleToggleSelect(item.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMedia.map((item) => (
                <MediaListItem
                  key={item.id}
                  item={item}
                  isSelected={selected.has(item.id)}
                  onToggle={() => handleToggleSelect(item.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {selected.size} selected
              {maxSelections && ` (max ${maxSelections})`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={selected.size === 0}>
                <Check className="h-4 w-4 mr-2" />
                Add Selected
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface MediaGridItemProps {
  item: MediaLibrary
  isSelected: boolean
  onToggle: () => void
}

function MediaGridItem({ item, isSelected, onToggle }: MediaGridItemProps) {
  const Icon = FILE_TYPE_ICONS[item.file_type]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-transparent hover:border-muted-foreground/30"
      )}
      onClick={onToggle}
    >
      {item.file_type === "image" ? (
        <img
          src={item.thumbnail_path || item.storage_path}
          alt={item.file_name}
          className="w-full h-full object-cover"
        />
      ) : item.file_type === "video" ? (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          {item.thumbnail_path ? (
            <img
              src={item.thumbnail_path}
              alt={item.file_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Video className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      {/* Selection indicator */}
      <div
        className={cn(
          "absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
          isSelected
            ? "bg-primary border-primary text-primary-foreground"
            : "bg-white/80 border-gray-300"
        )}
      >
        {isSelected && <Check className="h-3.5 w-3.5" />}
      </div>

      {/* File type badge */}
      <div className="absolute bottom-2 left-2">
        <Badge variant="secondary" className="text-xs bg-black/60 text-white border-0">
          {item.file_type}
        </Badge>
      </div>
    </motion.div>
  )
}

interface MediaListItemProps {
  item: MediaLibrary
  isSelected: boolean
  onToggle: () => void
}

function MediaListItem({ item, isSelected, onToggle }: MediaListItemProps) {
  const Icon = FILE_TYPE_ICONS[item.file_type]

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/50"
      )}
      onClick={onToggle}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
        {item.file_type === "image" ? (
          <img
            src={item.thumbnail_path || item.storage_path}
            alt={item.file_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.file_name}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="capitalize">{item.file_type}</span>
          <span>•</span>
          <span>{formatFileSize(item.file_size)}</span>
          {item.tags.length > 0 && (
            <>
              <span>•</span>
              <span>{item.tags.slice(0, 2).join(", ")}</span>
            </>
          )}
        </div>
      </div>

      {/* Selection checkbox */}
      <div
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
          isSelected
            ? "bg-primary border-primary text-primary-foreground"
            : "border-gray-300"
        )}
      >
        {isSelected && <Check className="h-3.5 w-3.5" />}
      </div>
    </div>
  )
}
