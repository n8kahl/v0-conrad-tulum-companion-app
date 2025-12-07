"use client"

import { useState, useEffect } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2, Plus, Image as ImageIcon, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MediaPicker } from "./media-picker"
import type { AssetMediaLink, MediaLibraryItem } from "@/lib/supabase/types"

interface AssetMediaManagerProps {
  assetId: string
  propertyId: string
  initialMedia?: AssetMediaLink[]
  onChange?: (media: AssetMediaLink[]) => void
  className?: string
}

const ROLES = [
  { value: "primary", label: "Primary File" },
  { value: "thumbnail", label: "Thumbnail" },
  { value: "preview", label: "Preview" },
]

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "all", label: "All Languages" },
]

export function AssetMediaManager({
  assetId,
  propertyId,
  initialMedia = [],
  onChange,
  className,
}: AssetMediaManagerProps) {
  const [allMedia, setAllMedia] = useState<AssetMediaLink[]>(initialMedia)
  const [selectedRole, setSelectedRole] = useState<string>("primary")
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [mediaItems, setMediaItems] = useState<Record<string, MediaLibraryItem>>({})

  // Sync with parent when initialMedia changes (e.g., from uploads)
  useEffect(() => {
    setAllMedia(initialMedia)
  }, [initialMedia])

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

  const getMediaForRole = (role: string) => {
    return allMedia.filter(m => m.role === role)
  }

  const handleAddMedia = (mediaIds: string[]) => {
    const roleMedia = getMediaForRole(selectedRole)
    
    // For primary and thumbnail, we usually only want one file per language
    // But for now let's just append
    
    const newLinks: AssetMediaLink[] = mediaIds.map((id, index) => ({
      id: crypto.randomUUID(),
      asset_id: assetId,
      media_id: id,
      role: selectedRole,
      language: "en", // Default to English
      version: 1,
      is_current: true,
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

  const handleLanguageChange = (linkId: string, language: string) => {
    const updated = allMedia.map(link => 
      link.id === linkId ? { ...link, language } : link
    )
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
      <Tabs defaultValue="primary" onValueChange={setSelectedRole}>
        <TabsList className="grid grid-cols-3 w-full">
          {ROLES.map(({ value, label }) => {
            const count = getMediaForRole(value).length
            return (
              <TabsTrigger key={value} value={value}>
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

        {ROLES.map(({ value: role, label }) => {
          const items = getMediaForRole(role)

          return (
            <TabsContent key={role} value={role} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {role === "primary" && "Main downloadable files or content"}
                  {role === "thumbnail" && "Cover images for the asset"}
                  {role === "preview" && "Preview images or pages"}
                </p>
                <Button
                  onClick={() => {
                    setSelectedRole(role)
                    setIsPickerOpen(true)
                  }}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {label}
                </Button>
              </div>

              {items.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No {label.toLowerCase()} added yet.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {items.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-4 p-3 bg-white border rounded-lg"
                    >
                      <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                        {mediaItems[link.media_id]?.thumbnail_path ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${mediaItems[link.media_id].thumbnail_path}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="h-6 w-6 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">
                          {mediaItems[link.media_id]?.original_filename || "Loading..."}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {mediaItems[link.media_id]?.file_type}
                          </Badge>
                        </div>
                      </div>

                      <Select
                        value={link.language}
                        onValueChange={(val) => handleLanguageChange(link.id, val)}
                      >
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMedia(link.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
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
        allowedTypes={selectedRole === "thumbnail" ? ["image"] : undefined}
      />
    </div>
  )
}
