"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { MapPin, GripVertical, X, Plus, Save } from "lucide-react"
import { cn } from "@/lib/utils"

interface VenuePin {
  id: string
  name: string
  x: number // Percentage from left (0-100)
  y: number // Percentage from top (0-100)
  venue_type?: string
}

interface MapPinEditorProps {
  /**
   * URL of the map image
   */
  mapUrl: string
  
  /**
   * Venues to display as pins
   */
  venues: VenuePin[]
  
  /**
   * Callback when a pin is moved
   */
  onUpdatePin: (venueId: string, x: number, y: number) => void
  
  /**
   * Optional: Allow clicking map to place new pins
   */
  onMapClick?: (x: number, y: number) => void
  
  /**
   * Show grid overlay for alignment
   */
  showGrid?: boolean
  
  /**
   * Enable editing mode
   */
  editMode?: boolean
}

export function MapPinEditor({
  mapUrl,
  venues,
  onUpdatePin,
  onMapClick,
  showGrid = false,
  editMode = true,
}: MapPinEditorProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [draggingVenueId, setDraggingVenueId] = useState<string | null>(null)
  const [hoveredVenueId, setHoveredVenueId] = useState<string | null>(null)
  const [showGridOverlay, setShowGridOverlay] = useState(showGrid)

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || !onMapClick || draggingVenueId) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    onMapClick(x, y)
  }

  const handlePinMouseDown = (venueId: string, e: React.MouseEvent) => {
    if (!editMode) return
    e.stopPropagation()
    setDraggingVenueId(venueId)
  }

  useEffect(() => {
    if (!draggingVenueId || !mapRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = mapRef.current!.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
      
      onUpdatePin(draggingVenueId, x, y)
    }

    const handleMouseUp = () => {
      setDraggingVenueId(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [draggingVenueId, onUpdatePin])

  return (
    <div className="space-y-4">
      {editMode && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {draggingVenueId ? "Drag pin to reposition..." : "Click and drag pins to position them on the map"}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowGridOverlay(!showGridOverlay)}
          >
            {showGridOverlay ? "Hide Grid" : "Show Grid"}
          </Button>
        </div>
      )}

      <Card className="relative overflow-hidden">
        <div
          ref={mapRef}
          className={cn(
            "relative w-full aspect-[4/3] bg-muted",
            editMode && "cursor-crosshair"
          )}
          onClick={handleMapClick}
        >
          {/* Map Image */}
          <Image
            src={mapUrl}
            alt="Venue map"
            fill
            className="object-contain"
            unoptimized
          />

          {/* Grid Overlay */}
          {showGridOverlay && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Vertical lines every 10% */}
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((x) => (
                <div
                  key={`v-${x}`}
                  className="absolute top-0 bottom-0 w-px bg-primary/20"
                  style={{ left: `${x}%` }}
                />
              ))}
              {/* Horizontal lines every 10% */}
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((y) => (
                <div
                  key={`h-${y}`}
                  className="absolute left-0 right-0 h-px bg-primary/20"
                  style={{ top: `${y}%` }}
                />
              ))}
              {/* Center crosshair */}
              <div className="absolute left-1/2 top-1/2 w-8 h-8 -ml-4 -mt-4 border-2 border-primary/40 rounded-full" />
            </div>
          )}

          {/* Venue Pins */}
          {venues.map((venue) => (
            <div
              key={venue.id}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-full transition-transform",
                editMode && "cursor-move hover:scale-110",
                draggingVenueId === venue.id && "scale-125 z-50",
                hoveredVenueId === venue.id && "z-40"
              )}
              style={{
                left: `${venue.x}%`,
                top: `${venue.y}%`,
              }}
              onMouseDown={(e) => handlePinMouseDown(venue.id, e)}
              onMouseEnter={() => setHoveredVenueId(venue.id)}
              onMouseLeave={() => setHoveredVenueId(null)}
            >
              {/* Pin Icon */}
              <div className="relative">
                <MapPin
                  className={cn(
                    "h-8 w-8 drop-shadow-lg transition-colors",
                    draggingVenueId === venue.id
                      ? "fill-primary text-primary"
                      : "fill-red-500 text-red-500",
                    hoveredVenueId === venue.id && "fill-primary text-primary"
                  )}
                />
                
                {/* Venue Label */}
                <div
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 rounded shadow-lg whitespace-nowrap text-xs font-medium transition-opacity",
                    "bg-background border border-border",
                    hoveredVenueId === venue.id || draggingVenueId === venue.id
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  {venue.name}
                  {editMode && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {venue.x.toFixed(1)}%, {venue.y.toFixed(1)}%
                    </div>
                  )}
                </div>
                
                {/* Drag Handle */}
                {editMode && (
                  <div
                    className={cn(
                      "absolute -top-2 -right-2 p-0.5 bg-background border border-border rounded-full shadow-md transition-opacity",
                      hoveredVenueId === venue.id || draggingVenueId === venue.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Coordinate Display */}
        {editMode && draggingVenueId && (
          <div className="absolute top-2 left-2 px-3 py-2 bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-lg">
            <div className="text-xs font-medium">
              {venues.find(v => v.id === draggingVenueId)?.name}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              X: {venues.find(v => v.id === draggingVenueId)?.x.toFixed(1)}%
              {" · "}
              Y: {venues.find(v => v.id === draggingVenueId)?.y.toFixed(1)}%
            </div>
          </div>
        )}
      </Card>

      {editMode && venues.length === 0 && (
        <div className="text-center p-8 border border-dashed border-border rounded-lg">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No child venues to display on this map
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Create venues with this venue as their parent to see them here
          </p>
        </div>
      )}

      {!editMode && venues.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          Click on pins to navigate to venue details
        </div>
      )}
    </div>
  )
}
