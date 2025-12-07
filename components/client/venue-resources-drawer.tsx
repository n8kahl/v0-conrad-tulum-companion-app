"use client"

import { useState } from "react"
import { VenueMedia } from "@/lib/supabase/types"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Image as ImageIcon, Map, Utensils, Zap } from "lucide-react"
import Image from "next/image"

interface VenueResourcesDrawerProps {
  venueName: string
  venueMedia: VenueMedia[]
  isOpen: boolean
  onClose: () => void
}

type ResourceGroup = {
  key: string
  label: string
  icon: React.ReactNode
  count: number
  media: VenueMedia[]
}

export function VenueResourcesDrawer({
  venueName,
  venueMedia,
  isOpen,
  onClose,
}: VenueResourcesDrawerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Group media by context
  const groups: ResourceGroup[] = [
    {
      key: "gallery",
      label: "Photos",
      icon: <ImageIcon className="h-4 w-4" />,
      count: venueMedia.filter((vm) => vm.context === "gallery").length,
      media: venueMedia.filter((vm) => vm.context === "gallery"),
    },
    {
      key: "floorplans",
      label: "Floorplans",
      icon: <Map className="h-4 w-4" />,
      count: venueMedia.filter((vm) =>
        ["floorplan", "capacity_chart"].includes(vm.context)
      ).length,
      media: venueMedia.filter((vm) =>
        ["floorplan", "capacity_chart"].includes(vm.context)
      ),
    },
    {
      key: "menus",
      label: "Menus",
      icon: <Utensils className="h-4 w-4" />,
      count: venueMedia.filter((vm) => vm.context === "menu").length,
      media: venueMedia.filter((vm) => vm.context === "menu"),
    },
    {
      key: "av",
      label: "AV & Tech",
      icon: <Zap className="h-4 w-4" />,
      count: venueMedia.filter((vm) => vm.context === "av_diagram").length,
      media: venueMedia.filter((vm) => vm.context === "av_diagram"),
    },
  ].filter((g) => g.count > 0)

  const totalResources = groups.reduce((sum, g) => sum + g.count, 0)

  if (totalResources === 0) {
    return null
  }

  const getMediaUrl = (media: VenueMedia) => {
    if (!media.media?.storage_path) return "/placeholder.svg"
    
    // Check if storage_path is already a full URL
    if (media.media.storage_path.startsWith("http")) {
      return media.media.storage_path
    }
    
    // Construct URL from storage path
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${media.media.storage_path}`
  }

  const getThumbnailUrl = (media: VenueMedia) => {
    if (media.media?.thumbnail_path) {
      if (media.media.thumbnail_path.startsWith("http")) {
        return media.media.thumbnail_path
      }
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${media.media.thumbnail_path}`
    }
    return getMediaUrl(media)
  }

  const isImage = (media: VenueMedia) => {
    return media.media?.file_type === "image" || 
           media.media?.mime_type?.startsWith("image/") ||
           ["gallery", "hero", "floorplan", "capacity_chart", "av_diagram"].includes(media.context)
  }

  const isPdf = (media: VenueMedia) => {
    return media.media?.file_type === "pdf" || 
           media.media?.mime_type === "application/pdf"
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left">{venueName} Resources</SheetTitle>
            <p className="text-sm text-muted-foreground text-left">
              {totalResources} resource{totalResources !== 1 ? "s" : ""} available
            </p>
          </SheetHeader>

          <Tabs defaultValue={groups[0]?.key} className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              {groups.map((group) => (
                <TabsTrigger
                  key={group.key}
                  value={group.key}
                  className="flex items-center gap-2"
                >
                  {group.icon}
                  <span className="hidden sm:inline">{group.label}</span>
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {group.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {groups.map((group) => (
              <TabsContent key={group.key} value={group.key} className="mt-0">
                <ScrollArea className="h-[calc(85vh-180px)]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-1">
                    {group.media
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((media) => (
                        <div
                          key={media.id}
                          className="relative group cursor-pointer rounded-lg overflow-hidden border bg-card"
                          onClick={() => {
                            if (isImage(media)) {
                              setSelectedImage(getMediaUrl(media))
                            } else if (isPdf(media)) {
                              window.open(getMediaUrl(media), "_blank")
                            }
                          }}
                        >
                          {isImage(media) ? (
                            <div className="aspect-video relative">
                              <Image
                                src={getThumbnailUrl(media)}
                                alt={media.media?.file_name || "Resource"}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, 33vw"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video flex flex-col items-center justify-center bg-muted p-4">
                              <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                              <p className="text-xs text-center line-clamp-2 text-muted-foreground">
                                {media.media?.file_name || "Document"}
                              </p>
                            </div>
                          )}

                          {/* Context badge */}
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="text-xs">
                              {media.context.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Full-screen image viewer */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedImage}
              alt="Full view"
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
