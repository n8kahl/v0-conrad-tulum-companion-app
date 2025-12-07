"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Upload,
  Trash2,
  Tag,
  Search,
  Grid3X3,
  List,
  HardDrive,
  Clock,
  AlertCircle,
  Check,
  X,
  Loader2,
  MoreHorizontal,
  Download,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { MediaLibrary, MediaFileType } from "@/lib/supabase/types"

interface ContentHubStats {
  total: number
  images: number
  videos: number
  documents: number
  audio: number
  storageUsed: number
  untagged: number
  recentCount: number
}

interface ContentHubDashboardProps {
  initialStats: ContentHubStats
}

const FILE_TYPE_ICONS: Record<MediaFileType, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  video: Video,
  document: FileText,
  audio: Music,
}

export function ContentHubDashboard({ initialStats }: ContentHubDashboardProps) {
  const [stats, setStats] = useState(initialStats)
  const [media, setMedia] = useState<MediaLibrary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<MediaFileType | "all">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const [previewItem, setPreviewItem] = useState<MediaLibrary | null>(null)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [newTag, setNewTag] = useState("")

  const supabase = createClient()

  // Fetch all media
  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("media_library")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error
        setMedia(data || [])
      } catch (error) {
        console.error("Failed to fetch media:", error)
        toast.error("Failed to load media")
      } finally {
        setLoading(false)
      }
    }

    fetchMedia()
  }, [supabase])

  // Filter media
  const filteredMedia = media.filter((item) => {
    if (activeTab !== "all" && item.file_type !== activeTab) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        item.file_name.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }
    return true
  })

  // Handle file upload
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      setUploading(true)
      const uploadedItems: MediaLibrary[] = []

      try {
        for (const file of Array.from(files)) {
          let fileType: MediaFileType = "document"
          if (file.type.startsWith("image/")) fileType = "image"
          else if (file.type.startsWith("video/")) fileType = "video"
          else if (file.type.startsWith("audio/")) fileType = "audio"

          const fileName = `uploads/${Date.now()}-${file.name}`
          const { error: uploadError } = await supabase.storage
            .from("media-library")
            .upload(fileName, file)

          if (uploadError) {
            console.error("Upload error:", uploadError)
            continue
          }

          const { data: urlData } = supabase.storage
            .from("media-library")
            .getPublicUrl(fileName)

          const { data: mediaRecord, error: dbError } = await supabase
            .from("media_library")
            .insert({
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

          if (!dbError && mediaRecord) {
            uploadedItems.push(mediaRecord)
          }
        }

        if (uploadedItems.length > 0) {
          setMedia((prev) => [...uploadedItems, ...prev])
          setStats((prev) => ({
            ...prev,
            total: prev.total + uploadedItems.length,
            untagged: prev.untagged + uploadedItems.length,
            storageUsed:
              prev.storageUsed +
              uploadedItems.reduce((acc, item) => acc + (item.file_size || 0), 0),
          }))
          toast.success(`Uploaded ${uploadedItems.length} file(s)`)
        }
      } catch (error) {
        console.error("Upload failed:", error)
        toast.error("Upload failed")
      } finally {
        setUploading(false)
        e.target.value = ""
      }
    },
    [supabase]
  )

  // Handle selection
  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelected(new Set(filteredMedia.map((m) => m.id)))
  }, [filteredMedia])

  const clearSelection = useCallback(() => {
    setSelected(new Set())
  }, [])

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (selected.size === 0) return

    const confirmed = window.confirm(
      `Delete ${selected.size} item(s)? This cannot be undone.`
    )
    if (!confirmed) return

    try {
      const idsToDelete = Array.from(selected)

      // Get storage paths
      const itemsToDelete = media.filter((m) => selected.has(m.id))
      const storagePaths = itemsToDelete
        .map((m) => m.storage_path.replace(/^.*media-library\//, ""))
        .filter(Boolean)

      // Delete from storage
      if (storagePaths.length > 0) {
        await supabase.storage.from("media-library").remove(storagePaths)
      }

      // Delete from database
      const { error } = await supabase
        .from("media_library")
        .delete()
        .in("id", idsToDelete)

      if (error) throw error

      setMedia((prev) => prev.filter((m) => !selected.has(m.id)))
      setSelected(new Set())
      toast.success(`Deleted ${idsToDelete.length} item(s)`)
    } catch (error) {
      console.error("Delete failed:", error)
      toast.error("Failed to delete items")
    }
  }, [selected, media, supabase])

  // Handle add tags
  const handleAddTag = useCallback(async () => {
    if (!newTag.trim() || selected.size === 0) return

    try {
      const tag = newTag.trim().toLowerCase()
      const idsToUpdate = Array.from(selected)

      // Update each selected item
      for (const id of idsToUpdate) {
        const item = media.find((m) => m.id === id)
        if (!item) continue

        const updatedTags = [...new Set([...item.tags, tag])]
        await supabase.from("media_library").update({ tags: updatedTags }).eq("id", id)
      }

      // Update local state
      setMedia((prev) =>
        prev.map((m) =>
          selected.has(m.id) ? { ...m, tags: [...new Set([...m.tags, tag])] } : m
        )
      )

      setNewTag("")
      setTagDialogOpen(false)
      toast.success(`Added tag "${tag}" to ${idsToUpdate.length} item(s)`)
    } catch (error) {
      console.error("Failed to add tag:", error)
      toast.error("Failed to add tag")
    }
  }, [newTag, selected, media, supabase])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Media</CardTitle>
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.images} images, {stats.videos} videos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.storageUsed)}</div>
            <p className="text-xs text-muted-foreground">Across all files</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentCount}</div>
            <p className="text-xs text-muted-foreground">In the last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Untagged</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.untagged}</div>
            <p className="text-xs text-muted-foreground">Need organization</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as MediaFileType | "all")}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="image">
                <ImageIcon className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="document">
                <FileText className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="audio">
                <Music className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

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
          <div className="relative">
            <input
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <Button disabled={uploading}>
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-4 p-3 bg-muted rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selected.size === filteredMedia.length}
                onCheckedChange={(checked) =>
                  checked ? selectAll() : clearSelection()
                }
              />
              <span className="text-sm font-medium">
                {selected.size} selected
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTagDialogOpen(true)}
              >
                <Tag className="h-4 w-4 mr-2" />
                Add Tag
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Grid/List */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No media found</p>
              <p className="text-sm">Upload some files to get started</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredMedia.map((item) => (
                <MediaGridCard
                  key={item.id}
                  item={item}
                  isSelected={selected.has(item.id)}
                  onToggle={() => toggleSelect(item.id)}
                  onPreview={() => setPreviewItem(item)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMedia.map((item) => (
                <MediaListRow
                  key={item.id}
                  item={item}
                  isSelected={selected.has(item.id)}
                  onToggle={() => toggleSelect(item.id)}
                  onPreview={() => setPreviewItem(item)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter tag name..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTag} disabled={!newTag.trim()}>
              Add Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.file_name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {previewItem?.file_type === "image" ? (
              <img
                src={previewItem.storage_path}
                alt={previewItem.file_name}
                className="w-full max-h-[60vh] object-contain rounded-lg"
              />
            ) : previewItem?.file_type === "video" ? (
              <video
                src={previewItem.storage_path}
                controls
                className="w-full max-h-[60vh] rounded-lg"
              />
            ) : previewItem?.file_type === "audio" ? (
              <div className="flex items-center justify-center py-12">
                <audio src={previewItem.storage_path} controls />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mb-4" />
                <p>Preview not available for this file type</p>
                <Button asChild className="mt-4">
                  <a href={previewItem?.storage_path} target="_blank" rel="noopener">
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </a>
                </Button>
              </div>
            )}
          </div>
          {previewItem && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{previewItem.file_type}</Badge>
              <Badge variant="outline">
                {formatFileSize(previewItem.file_size || 0)}
              </Badge>
              {previewItem.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface MediaGridCardProps {
  item: MediaLibrary
  isSelected: boolean
  onToggle: () => void
  onPreview: () => void
}

function MediaGridCard({ item, isSelected, onToggle, onPreview }: MediaGridCardProps) {
  const Icon = FILE_TYPE_ICONS[item.file_type]

  return (
    <div
      className={cn(
        "relative group aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-transparent hover:border-muted-foreground/30"
      )}
    >
      {item.file_type === "image" ? (
        <img
          src={item.thumbnail_path || item.storage_path}
          alt={item.file_name}
          className="w-full h-full object-cover"
          onClick={onPreview}
        />
      ) : (
        <div
          className="w-full h-full bg-muted flex items-center justify-center"
          onClick={onPreview}
        >
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      {/* Checkbox */}
      <div
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
      >
        <div
          className={cn(
            "w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
            isSelected
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-white/80 border-gray-300 hover:border-primary"
          )}
        >
          {isSelected && <Check className="h-3.5 w-3.5" />}
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onPreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={item.storage_path} download target="_blank" rel="noopener">
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* File name */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-white text-xs truncate">{item.file_name}</p>
      </div>
    </div>
  )
}

interface MediaListRowProps {
  item: MediaLibrary
  isSelected: boolean
  onToggle: () => void
  onPreview: () => void
}

function MediaListRow({ item, isSelected, onToggle, onPreview }: MediaListRowProps) {
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
        "flex items-center gap-4 p-3 rounded-lg border transition-all",
        isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
      )}
    >
      <Checkbox checked={isSelected} onCheckedChange={() => onToggle()} />

      <div
        className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
        onClick={onPreview}
      >
        {item.file_type === "image" ? (
          <img
            src={item.thumbnail_path || item.storage_path}
            alt={item.file_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.file_name}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="capitalize">{item.file_type}</span>
          <span>•</span>
          <span>{formatFileSize(item.file_size)}</span>
          <span>•</span>
          <span>{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {item.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
        {item.tags.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{item.tags.length - 3}
          </Badge>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={item.storage_path} download target="_blank" rel="noopener">
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
