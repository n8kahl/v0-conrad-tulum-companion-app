"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, Image as ImageIcon, Download, ExternalLink, Table } from "lucide-react"
import type { VenueMediaLink, VenueMediaContext } from "@/lib/supabase/types"

interface VenueMediaViewerProps {
  venueId: string
  venueName: string
  isOpen: boolean
  onClose: () => void
  onManage?: () => void
  refreshKey?: number
}

const CONTEXT_LABELS: Record<string, string> = {
  hero: "Hero",
  floorplan: "Floor Plans",
  capacity_chart: "Capacities",
  menu: "Menus",
  av_diagram: "AV & Tech",
  setup_theater: "Theater Setup",
  setup_banquet: "Banquet Setup",
  setup_classroom: "Classroom Setup",
  setup_reception: "Reception Setup",
  gallery: "Photos",
  video_walkthrough: "Video Walkthroughs",
  previous_event: "Previous Events",
  "360_tour": "360 Tours",
}

export function VenueMediaViewer({
  venueId,
  venueName,
  isOpen,
  onClose,
  onManage,
  refreshKey,
}: VenueMediaViewerProps) {
  const [mediaLinks, setMediaLinks] = useState<VenueMediaLink[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("floorplan")
  const [viewingExtraction, setViewingExtraction] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && venueId) {
      fetchMedia()
    }
  }, [isOpen, venueId, refreshKey])

  const fetchMedia = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("venue_media")
        .select("*, media:media_library(*, pdf_extractions(*))")
        .eq("venue_id", venueId)
        .eq("show_on_tour", true)
        .order("display_order")

      if (data) {
        setMediaLinks(data as VenueMediaLink[])
        
        // Set active tab to first available category
        const typedData = data as VenueMediaLink[]
        const availableContexts = new Set(typedData.map(d => d.context))
        if (!availableContexts.has(activeTab as any)) {
          const firstContext = Object.keys(CONTEXT_LABELS).find(c => availableContexts.has(c as any))
          if (firstContext) setActiveTab(firstContext)
        }
      }
    } catch (error) {
      console.error("Error fetching media:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const groupedMedia = mediaLinks.reduce((acc, link) => {
    if (!acc[link.context]) acc[link.context] = []
    acc[link.context].push(link)
    return acc
  }, {} as Record<string, VenueMediaLink[]>)

  const availableTabs = Object.keys(CONTEXT_LABELS).filter(key => groupedMedia[key]?.length > 0)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle>{venueName} - Resources</SheetTitle>
            {onManage && (
              <Button size="sm" variant="outline" onClick={onManage}>
                Manage media
              </Button>
            )}
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : availableTabs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <FileText className="h-12 w-12 mb-4 opacity-20" />
            <p>No resources available for this venue.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-2 border-b overflow-x-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start h-auto p-1 bg-transparent gap-2">
                  {availableTabs.map(key => (
                    <TabsTrigger 
                      key={key} 
                      value={key}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-2 border"
                    >
                      {CONTEXT_LABELS[key]}
                      <Badge variant="secondary" className="ml-2 bg-white/20 text-inherit text-[10px] h-4 px-1">
                        {groupedMedia[key].length}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <ScrollArea className="flex-1 bg-gray-50">
              <div className="p-6 space-y-4">
                {groupedMedia[activeTab]?.map((link) => (
                  <div key={link.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    {/* Preview */}
                    <div className="aspect-video bg-gray-100 relative group">
                      {link.media?.thumbnail_path ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${link.media.thumbnail_path}`}
                          alt={link.media.alt_text || ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          {link.media?.file_type === "pdf" ? (
                            <FileText className="h-12 w-12" />
                          ) : (
                            <ImageIcon className="h-12 w-12" />
                          )}
                        </div>
                      )}
                      
                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button variant="secondary" size="sm" asChild>
                          <a 
                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${link.media?.storage_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Full
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-medium text-sm line-clamp-1">
                            {link.media?.original_filename}
                          </h4>
                          {link.caption && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {link.caption}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a 
                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${link.media?.storage_path}`}
                            download
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">
                          {link.media?.file_type.toUpperCase()}
                        </Badge>
                        {link.media?.file_size_bytes && (
                          <span className="text-[10px] text-muted-foreground">
                            {(link.media.file_size_bytes / 1024 / 1024).toFixed(1)} MB
                          </span>
                        )}
                      </div>

                      {/* Extractions Button */}
                      {(link.media as any)?.pdf_extractions?.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-3 gap-2 text-xs h-8"
                          onClick={() => setViewingExtraction((link.media as any).pdf_extractions[0])}
                        >
                          <Table className="h-3 w-3" />
                          View Extracted Data
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </SheetContent>

      <Dialog open={!!viewingExtraction} onOpenChange={(open) => !open && setViewingExtraction(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Extracted Data</DialogTitle>
          </DialogHeader>
          {viewingExtraction && (
            <div className="space-y-4">
              {viewingExtraction.extracted_text && (
                <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-mono text-xs">
                  {viewingExtraction.extracted_text.slice(0, 500)}...
                </div>
              )}
              {viewingExtraction.extracted_data?.tables?.map((table: any, i: number) => (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {table.map((row: string[], rowIndex: number) => (
                          <tr key={rowIndex} className="border-b last:border-0 hover:bg-muted/50">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="p-2 border-r last:border-0 min-w-[100px]">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
