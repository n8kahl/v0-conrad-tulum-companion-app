"use client"

import type { Venue, VisitStop } from "@/lib/supabase/types"
import { useState, useRef } from "react"
import Image from "next/image"
import { VenuePin } from "./venue-pin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Map, ZoomIn, ZoomOut, Maximize2, X, Heart, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { getBrandingConfig } from "@/lib/branding/config"

interface ResortMapProps {
  venues: Venue[]
  stops?: (VisitStop & { venue: Venue })[]
  onVenueClick?: (venue: Venue) => void
  showTourRoute?: boolean
  className?: string
}

export function ResortMap({
  venues,
  stops = [],
  onVenueClick,
  showTourRoute = false,
  className
}: ResortMapProps) {
  const [activeVenue, setActiveVenue] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const branding = getBrandingConfig()
  const mapRef = useRef<HTMLDivElement>(null)

  // Get venue data for stops
  const tourVenues = showTourRoute
    ? stops.map((stop, index) => ({
        venue: stop.venue,
        stopNumber: index + 1,
        isFavorited: stop.client_favorited,
      }))
    : venues.map((venue) => ({
        venue,
        stopNumber: undefined,
        isFavorited: false,
      }))

  const handleVenueClick = (venue: Venue) => {
    setActiveVenue(activeVenue === venue.id ? null : venue.id)
    onVenueClick?.(venue)
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const handleResetZoom = () => setZoom(1)

  const activeVenueData = venues.find((v) => v.id === activeVenue)

  // Generate SVG path for route
  const generateRoutePath = () => {
    if (!showTourRoute || stops.length < 2) return null

    const points = stops
      .map((stop) => {
        const x = stop.venue.map_coordinates?.x ?? 50
        const y = stop.venue.map_coordinates?.y ?? 50
        return { x, y }
      })
      .filter((p) => p.x !== 50 || p.y !== 50) // Filter out default positions

    if (points.length < 2) return null

    const pathData = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ")

    return pathData
  }

  const routePath = generateRoutePath()

  const MapContent = () => (
    <div
      ref={mapRef}
      className={cn(
        "relative w-full overflow-hidden rounded-lg bg-muted",
        isFullscreen ? "h-[80vh]" : "aspect-[4/3]"
      )}
    >
      {/* Map Image */}
      <div
        className="relative w-full h-full transition-transform duration-200 ease-out"
        style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
      >
        <Image
          src={branding.images.resortMap || branding.images.placeholder}
          alt={`${branding.property.shortName} Resort Map`}
          fill
          className="object-contain"
          priority
        />

        {/* Route Lines (SVG Overlay) */}
        {routePath && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d={routePath}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
              strokeDasharray="2,1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />
          </svg>
        )}

        {/* Venue Pins */}
        {tourVenues.map(({ venue, stopNumber, isFavorited }) => (
          <VenuePin
            key={venue.id}
            venue={venue}
            stopNumber={stopNumber}
            isFavorited={isFavorited}
            isActive={activeVenue === venue.id}
            onClick={() => handleVenueClick(venue)}
          />
        ))}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 shadow-md"
          onClick={handleZoomIn}
          disabled={zoom >= 2}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 shadow-md"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        {zoom !== 1 && (
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 shadow-md text-xs"
            onClick={handleResetZoom}
          >
            1x
          </Button>
        )}
      </div>

      {/* Fullscreen Toggle */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-4 right-4 h-8 w-8 shadow-md"
        onClick={() => setIsFullscreen(!isFullscreen)}
      >
        {isFullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>

      {/* Active Venue Info Panel */}
      {activeVenueData && (
        <div className="absolute bottom-4 left-4 right-16 max-w-sm">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-foreground">{activeVenueData.name}</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {activeVenueData.venue_type.replace("_", " ")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setActiveVenue(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeVenueData.capacities?.reception && (
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {activeVenueData.capacities.reception} reception
                  </Badge>
                )}
                {activeVenueData.dimensions?.sqm && (
                  <Badge variant="outline" className="text-xs">
                    {activeVenueData.dimensions.sqm} m²
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legend */}
      {showTourRoute && (
        <div className="absolute top-4 left-4">
          <Card className="shadow-md">
            <CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Tour Route</p>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-primary border-2 border-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold">
                    1
                  </div>
                  <span className="text-muted-foreground">Stop</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-500" fill="currentColor" />
                  <span className="text-muted-foreground">Favorite</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4 flex items-center justify-center">
        <div className="w-full max-w-6xl">
          <MapContent />
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          Resort Map
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <MapContent />
      </CardContent>
    </Card>
  )
}
