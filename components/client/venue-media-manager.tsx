"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2, Upload, CheckCircle, Eye, Crown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { VenueMediaContext, VenueMediaLink } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

type ContextOption = {
  value: VenueMediaContext
  label: string
  helper: string
}

const CONTEXT_OPTIONS: ContextOption[] = [
  { value: "hero", label: "Hero", helper: "Primary hero image" },
  { value: "gallery", label: "Gallery", helper: "General photos" },
  { value: "menu", label: "Menu", helper: "Food & beverage menus" },
  { value: "floorplan", label: "Floorplan", helper: "Layouts and diagrams" },
  { value: "capacity_chart", label: "Capacity Chart", helper: "Seating diagrams" },
  { value: "av_diagram", label: "AV Diagram", helper: "Technical layouts" },
  { value: "setup_theater", label: "Theater Setup", helper: "Example room setup" },
  { value: "setup_banquet", label: "Banquet Setup", helper: "Example room setup" },
  { value: "setup_classroom", label: "Classroom Setup", helper: "Example room setup" },
  { value: "setup_reception", label: "Reception Setup", helper: "Example room setup" },
  { value: "video_walkthrough", label: "Video Walkthrough", helper: "Video content" },
  { value: "previous_event", label: "Previous Event", helper: "Past event showcase" },
  { value: "360_tour", label: "360 Tour", helper: "Virtual tours" },
]

interface VenueMediaManagerProps {
  venueId: string
  propertyId: string
  venueName: string
  isOpen: boolean
  onClose: () => void
  onUpdated?: () => void
}

interface UploadState {
  file: File | null
  context: VenueMediaContext
  caption: string
  showOnTour: boolean
  showOnPublic: boolean
  isPrimary: boolean
}

export function VenueMediaManager({
  venueId,
  propertyId,
  venueName,
  isOpen,
  onClose,
  onUpdated,
}: VenueMediaManagerProps) {
  const [media, setMedia] = useState<VenueMediaLink[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    context: "gallery",
    caption: "",
    showOnTour: true,
    showOnPublic: true,
    isPrimary: false,
  })

  useEffect(() => {
    if (isOpen) {
      fetchMedia()
    }
  }, [isOpen])

  const fetchMedia = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/venues/${venueId}/media`)
      if (!res.ok) throw new Error("Failed to fetch venue media")
      const data = await res.json()
      setMedia(data)
    } catch (error) {
      console.error(error)
      toast.error("Could not load media for this venue.")
    } finally {
      setIsLoading(false)
    }
  }

  const groupedMedia = useMemo(() => {
    const grouped: Record<string, VenueMediaLink[]> = {}
    media.forEach((item) => {
      const list = grouped[item.context] || []
      list.push(item)
      grouped[item.context] = list.sort((a, b) => a.display_order - b.display_order)
    })
    return grouped
  }, [media])

  const resetUploadState = () => {
    setUploadState({
      file: null,
      context: "gallery",
      caption: "",
      showOnTour: true,
      showOnPublic: true,
      isPrimary: false,
    })
  }

  const handleUpload = async () => {
    if (!uploadState.file) {
      toast.error("Please select a file to upload.")
      return
    }

    setUploading(true)
    try {
      // Upload to media library
      const formData = new FormData()
      formData.append("file", uploadState.file)
      formData.append("propertyId", propertyId)

      const uploadRes = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}))
        throw new Error(body.error || "Upload failed")
      }

      const { mediaId } = await uploadRes.json()
      // Link to venue
      const linkRes = await fetch(`/api/venues/${venueId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId,
          context: uploadState.context,
          caption: uploadState.caption || null,
          isPrimary: uploadState.isPrimary || uploadState.context === "hero",
          showOnTour: uploadState.showOnTour,
          showOnPublic: uploadState.showOnPublic,
        }),
      })

      if (!linkRes.ok) {
        const body = await linkRes.json().catch(() => ({}))
        throw new Error(body.error || "Failed to link media to venue")
      }

      toast.success("Media added to venue")
      await fetchMedia()
      onUpdated?.()
      resetUploadState()
      setIsAdding(false)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unable to add media")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (linkId: string) => {
    const confirmed = confirm("Remove this media from the venue?")
    if (!confirmed) return

    try {
      const res = await fetch(`/api/venues/${venueId}/media/${linkId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to remove media")
      setMedia((prev) => prev.filter((item) => item.id !== linkId))
      onUpdated?.()
      toast.success("Media removed")
    } catch (error) {
      console.error(error)
      toast.error("Could not remove media")
    }
  }

  const handleSetPrimary = async (linkId: string) => {
    try {
      const res = await fetch(`/api/venues/${venueId}/media/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      })
      if (!res.ok) throw new Error("Failed to update primary")
      const updated = await res.json()
      setMedia((prev) =>
        prev.map((item) =>
          item.context === updated.context
            ? { ...item, is_primary: item.id === updated.id }
            : item
        )
      )
      onUpdated?.()
      toast.success("Set as primary")
    } catch (error) {
      console.error(error)
      toast.error("Could not set as primary")
    }
  }

  const handleToggleVisibility = async (
    linkId: string,
    field: "show_on_tour" | "show_on_public",
    nextValue: boolean
  ) => {
    try {
      const res = await fetch(`/api/venues/${venueId}/media/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [field === "show_on_tour" ? "showOnTour" : "showOnPublic"]: nextValue,
        }),
      })
      if (!res.ok) throw new Error("Failed to update visibility")
      const updated = await res.json()
      setMedia((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      )
      onUpdated?.()
    } catch (error) {
      console.error(error)
      toast.error("Could not update visibility")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage media for {venueName}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Upload photos, menus, floorplans, and link them to this venue. New items are available instantly in tour resources.
          </p>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add media
          </Button>
        </div>

        <Tabs defaultValue="gallery" className="mt-4">
          <TabsList className="flex flex-wrap gap-2">
            {CONTEXT_OPTIONS.map((opt) => {
              const count = groupedMedia[opt.value]?.length || 0
              return (
                <TabsTrigger key={opt.value} value={opt.value}>
                  {opt.label}
                  <Badge variant="secondary" className="ml-2">
                    {count}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {CONTEXT_OPTIONS.map((opt) => (
            <TabsContent key={opt.value} value={opt.value} className="mt-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground border rounded-lg px-3 py-2 bg-muted/40">
                <span>{opt.helper}</span>
                <span>
                  {groupedMedia[opt.value]?.length || 0} item
                  {(groupedMedia[opt.value]?.length || 0) === 1 ? "" : "s"}
                </span>
              </div>

              <ScrollArea className="mt-3 max-h-[320px] rounded-lg border">
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading media...</p>
                  ) : groupedMedia[opt.value]?.length ? (
                    groupedMedia[opt.value].map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg overflow-hidden bg-background"
                      >
                        <div className="aspect-video bg-muted relative">
                          {item.media?.thumbnail_path ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${item.media.thumbnail_path}`}
                              alt={item.media?.alt_text || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : item.media?.storage_path ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${item.media.storage_path}`}
                              alt={item.media?.alt_text || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              No preview
                            </div>
                          )}
                          {item.is_primary && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full inline-flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              Primary
                            </div>
                          )}
                        </div>

                        <div className="p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium line-clamp-1">
                                {item.media?.title || item.media?.original_filename || "Untitled"}
                              </p>
                              {item.caption && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {item.caption}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              {(item.media?.file_type || "file").toUpperCase()}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Show on tour</span>
                            <Switch
                              checked={item.show_on_tour}
                              onCheckedChange={(checked) =>
                                handleToggleVisibility(item.id, "show_on_tour", checked)
                              }
                            />
                            <span>Public</span>
                            <Switch
                              checked={item.show_on_public}
                              onCheckedChange={(checked) =>
                                handleToggleVisibility(item.id, "show_on_public", checked)
                              }
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                window.open(
                                  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${item.media?.storage_path}`,
                                  "_blank"
                                )
                              }
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetPrimary(item.id)}
                              disabled={item.context === "menu" || item.context === "floorplan"}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Set as primary
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nothing here yet. Add media for this context.</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {/* Add media dialog */}
        <Dialog open={isAdding} onOpenChange={(open) => {
          setIsAdding(open)
          if (!open) resetUploadState()
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add media to {venueName}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>File</Label>
                <Input
                  type="file"
                  accept="image/*,application/pdf,video/*"
                  onChange={(e) =>
                    setUploadState((prev) => ({
                      ...prev,
                      file: e.target.files?.[0] || null,
                      isPrimary:
                        prev.context === "hero"
                          ? true
                          : prev.isPrimary,
                    }))
                  }
                />
              </div>

              <div className="space-y-1">
                <Label>Context</Label>
                <select
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-sm",
                    "bg-background"
                  )}
                  value={uploadState.context}
                  onChange={(e) =>
                    setUploadState((prev) => ({
                      ...prev,
                      context: e.target.value as VenueMediaContext,
                      isPrimary:
                        e.target.value === "hero" ? true : prev.isPrimary,
                    }))
                  }
                >
                  {CONTEXT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Choose how this file is used (hero, gallery, menus, resources, floorplans).
                </p>
              </div>

              <div className="space-y-1">
                <Label>Caption / label</Label>
                <Input
                  placeholder="Optional caption"
                  value={uploadState.caption}
                  onChange={(e) =>
                    setUploadState((prev) => ({ ...prev, caption: e.target.value }))
                  }
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={uploadState.showOnTour}
                  onCheckedChange={(checked) =>
                    setUploadState((prev) => ({ ...prev, showOnTour: checked }))
                  }
                />
                <span className="text-sm">Show during tour</span>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={uploadState.showOnPublic}
                  onCheckedChange={(checked) =>
                    setUploadState((prev) => ({ ...prev, showOnPublic: checked }))
                  }
                />
                <span className="text-sm">Show on public experiences</span>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={uploadState.isPrimary || uploadState.context === "hero"}
                  disabled={uploadState.context === "hero"}
                  onCheckedChange={(checked) =>
                    setUploadState((prev) => ({ ...prev, isPrimary: checked }))
                  }
                />
                <span className="text-sm">Set as primary for this context</span>
              </div>

              <Button onClick={handleUpload} disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload and link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
