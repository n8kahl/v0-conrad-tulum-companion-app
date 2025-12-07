"use client"

import { useState, useEffect } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2, Plus, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MediaPicker } from "./media-picker"
import type { VenueMediaLink, VenueMediaContext, MediaLibraryItem } from "@/lib/supabase/types"

interface VenueMediaManagerProps {
  venueId: string
  propertyId: string
  initialMedia?: VenueMediaLink[]
  onChange?: (media: VenueMediaLink[]) => void
  className?: string
}

type ContextGroup = {
  label: string
  description: string
  allowedTypes?: ("image" | "pdf" | "video")[]
}

const CONTEXT_CONFIG: Record<string, ContextGroup> = {
  hero: {
    label: "Hero Image",
    description: "Main promotional image",
  },
  gallery: {
    label: "Photo Gallery",
    description: "Additional venue photos",
  },
  floorplan: {
    label: "Floor Plans",
    description: "Architectural layouts",
    allowedTypes: ["image", "pdf"],
  },
  capacity_chart: {
    label: "Capacity Charts",
    description: "Seating configurations",
    allowedTypes: ["pdf"],
  },
  menu: {
    label: "Menus",
    description: "F&B menus and options",
    allowedTypes: ["pdf"],
  },
  av_diagram: {
    label: "AV Diagrams",
    description: "Audio/visual layouts",
    allowedTypes: ["pdf", "image"],
  },
}

export function VenueMediaManager({
  venueId,
  propertyId,
  initialMedia = [],
  onChange,
  className,
}: VenueMediaManagerProps) {
  const [allMedia, setAllMedia] = useState<VenueMediaLink[]>(initialMedia)
  const [selectedContext, setSelectedContext] = useState<string>("hero")
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [mediaItems, setMediaItems] = useState<Record<string, MediaLibraryItem>>({})

  // Fetch media details
  useEffect(() => {
    if (allMedia.length > 0) {
      const mediaIds = allMedia.map(m => m.media_id)
      fetchMediaDetails(mediaIds)
    }
  }, [allMedia.length])

  const fetchMediaDetails = async (mediaIds: string[]) => {
    try {
      const promises = mediaIds.map(id => 
        fetch(`/api/media/${id}`).then(r => r.json())
      )
      const results = await Promise.all(promises)
      
      const itemsMap = results.reduce((acc, item) => {
        acc[item.id] = item
        return acc
      }, {} as Record<string, MediaLibraryItem>)
      
      setMediaItems(prev => ({ ...prev, ...itemsMap }))
    } catch (error) {
      console.error("Failed to fetch media details:", error)
    }
  }

  const getMediaForContext = (context: string) => {
    return allMedia.filter(m => m.context === context)
  }

  const handleAddMedia = (mediaIds: string[]) => {
    const contextMedia = getMediaForContext(selectedContext)
    const newLinks: VenueMediaLink[] = mediaIds.map((id, index) => ({
      id: crypto.randomUUID(),
      venue_id: venueId,
      media_id: id,
      context: selectedContext as VenueMediaContext,
      display_order: contextMedia.length + index,
      is_primary: contextMedia.length === 0 && index === 0,
      caption: null,
      show_on_tour: true,
      show_on_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const updated = [...allMedia, ...newLinks]
    setAllMedia(updated)
    if (onChange) onChange(updated)
    
    fetchMediaDetails(mediaIds)
    setIsPickerOpen(false)
  }

  const handleRemoveMedia = (linkId: string) => {
    const updated = allMedia.filter(link => link.id !== linkId)
    setAllMedia(updated)
    if (onChange) onChange(updated)
  }

  const handleReorder = (context: string, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const contextMedia = allMedia.filter(m => m.context === context)
    const otherMedia = allMedia.filter(m => m.context !== context)
    
    const oldIndex = contextMedia.findIndex(item => item.id === active.id)
    const newIndex = contextMedia.findIndex(item => item.id === over.id)

    const reordered = arrayMove(contextMedia, oldIndex, newIndex)
      .map((link, index) => ({ ...link, display_order: index, updated_at: new Date().toISOString() }))

    const updated = [...otherMedia, ...reordered]
    setAllMedia(updated)
    if (onChange) onChange(updated)
  }

  const handleSetPrimary = (context: string, linkId: string) => {
    const updated = allMedia.map(link => ({
      ...link,
      is_primary: link.context === context ? link.id === linkId : link.is_primary,
      updated_at: link.context === context ? new Date().toISOString() : link.updated_at,
    }))

    setAllMedia(updated)
    if (onChange) onChange(updated)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs defaultValue="hero" onValueChange={setSelectedContext}>
        <TabsList className="grid grid-cols-6 w-full">
          {Object.entries(CONTEXT_CONFIG).map(([key, { label }]) => {
            const count = getMediaForContext(key).length
            return (
              <TabsTrigger key={key} value={key} className="text-xs">
                {label}
                {count > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {Object.entries(CONTEXT_CONFIG).map(([key, { label, description, allowedTypes }]) => {
          const items = getMediaForContext(key)

          return (
            <TabsContent key={key} value={key} className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{label}</h3>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
                <Button
                  onClick={() => {
                    setSelectedContext(key)
                    setIsPickerOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {label}
                </Button>
              </div>

              {items.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No {label.toLowerCase()} added yet. Click "Add {label}" to select from media library.
                  </AlertDescription>
                </Alert>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleReorder(key, event)}
                >
                  <SortableContext
                    items={items.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {items.map((link) => (
                        <SortableMediaItem
                          key={link.id}
                          link={link}
                          mediaItem={mediaItems[link.media_id]}
                          context={key}
                          onRemove={() => handleRemoveMedia(link.id)}
                          onSetPrimary={() => handleSetPrimary(key, link.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      <MediaPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleAddMedia}
        propertyId={propertyId}
        allowedTypes={CONTEXT_CONFIG[selectedContext]?.allowedTypes as any}
      />
    </div>
  )
}

interface SortableMediaItemProps {
  link: VenueMediaLink
  mediaItem?: MediaLibraryItem
  context: string
  onRemove: () => void
  onSetPrimary: () => void
}

function SortableMediaItem({ link, mediaItem, context, onRemove, onSetPrimary }: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const thumbnailUrl = mediaItem?.thumbnail_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${mediaItem.thumbnail_path}`
    : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-4 p-3 bg-white border rounded-lg",
        link.is_primary && "border-primary bg-primary/5"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </button>

      <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={mediaItem?.alt_text || ""}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {mediaItem?.original_filename || "Loading..."}
        </p>
        {mediaItem?.alt_text && (
          <p className="text-sm text-gray-500 truncate">{mediaItem.alt_text}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {link.is_primary && (
            <Badge variant="default" className="text-xs">
              Primary
            </Badge>
          )}
          {mediaItem && (
            <Badge variant="outline" className="text-xs">
              {mediaItem.file_type}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!link.is_primary && context === "hero" && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSetPrimary}
          >
            Set Primary
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </div>
  )
}
