"use client"

import type { Venue, VisitStop } from "@/lib/supabase/types"
import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { VenuePin } from "./venue-pin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Map, ZoomIn, ZoomOut, Maximize2, X, Heart, Users, ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { getBrandingConfig } from "@/lib/branding/config"

interface ResortMapProps {
  venues: Venue[]
  stops?: (VisitStop & { venue: Venue })[]
  onVenueClick?: (venue: Venue) => void
  showTourRoute?: boolean
  className?: string
  /**
   * ID of venue whose map to display (for hierarchical navigation)
   * If not provided, shows top-level (property) map
   */
  currentVenueId?: string
  /**
   * Enable hierarchical navigation (zoom into venues with maps)
   */
  enableHierarchy?: boolean
}

export function ResortMap({
  venues,
  stops = [],
  onVenueClick,
  showTourRoute = false,
  className,
  currentVenueId,
  enableHierarchy = false,
}: ResortMapProps) {
  const supabase = createClient()
  const [activeVenue, setActiveVenue] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [currentVenue, setCurrentVenue] = useState<Venue | null>(null)
  const [venuePath, setVenuePath] = useState<Array<{id: string, name: string, venue_type: string}>>([])
  const [childVenues, setChildVenues] = useState<Venue[]>([])
  const branding = getBrandingConfig()
  const mapRef = useRef<HTMLDivElement>(null)

  // Load current venue and hierarchy
  useEffect(() => {
    if (!enableHierarchy) return

    const loadVenueHierarchy = async () => {
      if (currentVenueId) {
        // Load specific venue
        const { data: venue } = await supabase
          .from("venues")
          .select("*")
          .eq("id", currentVenueId)
          .single()
        
        if (venue) {
          setCurrentVenue(venue as Venue)
        }

        // Load breadcrumb path
        const { data: path } = await supabase
          .rpc("get_venue_path", { venue_id: currentVenueId })
        
        if (path) {
          setVenuePath(path)
        }

        // Load child venues
        const { data: children } = await supabase
          .from("venues")
          .select("*")
          .eq("parent_venue_id", currentVenueId)
          .eq("is_active", true)
        
        if (children) {
          setChildVenues(children as Venue[])
        }
      } else {
        // Load property-level venue
        const { data: property } = await supabase
          .from("venues")
          .select("*")
          .eq("venue_type", "property")
          .single()
        
        if (property) {
          setCurrentVenue(property as Venue)
          setVenuePath([{id: property.id, name: property.name, venue_type: property.venue_type}])
        }

        // Load top-level venues
        const { data: topLevel } = await supabase
          .from("venues")
          .select("*")
          .is("parent_venue_id", null)
          .eq("is_active", true)
        
        if (topLevel) {
          setChildVenues(topLevel as Venue[])
        }
      }
    }

    loadVenueHierarchy()
  }, [currentVenueId, enableHierarchy, supabase])

  // Get venues to display (either from props or from hierarchy)
  const venuesToDisplay = enableHierarchy ? childVenues : venues
  
  // Get venue data for stops
  const tourVenues = showTourRoute
    ? stops.map((stop, index) => ({
        venue: stop.venue,
        stopNumber: index + 1,
        isFavorited: stop.client_favorited,
      }))
    : venuesToDisplay.map((venue) => ({
        venue,
        stopNumber: undefined,
        isFavorited: false,
      }))

  const handleVenueClick = (venue: Venue) => {
    setActiveVenue(activeVenue === venue.id ? null : venue.id)
    onVenueClick?.(venue)
  }

  // Get map image URL (from current venue or branding)
  const mapImageUrl = enableHierarchy && currentVenue?.map_image_url
    ? currentVenue.map_image_url
    : branding.images.resortMap || branding.images.placeholder
  
  // Get map coordinates from location.mapX/mapY for hierarchical venues
  const getVenueMapCoordinates = (venue: Venue) => {
    if (venue.location?.mapX !== undefined && venue.location?.mapY !== undefined) {
      return { x: venue.location.mapX, y: venue.location.mapY }
    }
    return venue.map_coordinates || { x: 50, y: 50 }
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
      {/* Breadcrumb Navigation */}
      {enableHierarchy && venuePath.length > 0 && (
        <div className="absolute top-4 left-4 z-10">
          <Card className="shadow-md">
            <CardContent className="p-2 flex items-center gap-1 text-xs">
              {venuePath.map((pathVenue, index) => (
                <div key={pathVenue.id} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  <Button
                    variant={index === 0 ? "ghost" : "link"}
                    size="sm"
                    className="h-auto py-1 px-2 text-xs"
                    onClick={() => {
                      if (enableHierarchy && pathVenue.id !== currentVenueId) {
                        window.location.href = `?venueId=${pathVenue.id}`
                      }
                    }}
                  >
                    {index === 0 && <Home className="h-3 w-3 mr-1" />}
                    {pathVenue.name}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Image */}
      <div
        className="relative w-full h-full transition-transform duration-200 ease-out"
        style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
      >
        <Image
          src={mapImageUrl}
          alt={enableHierarchy && currentVenue ? `${currentVenue.name} Map` : `${branding.property.shortName} Resort Map`}
          fill
          className="object-contain"
          unoptimized
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
        {tourVenues.map(({ venue, stopNumber, isFavorited }) => {
          const coords = getVenueMapCoordinates(venue)
          return (
            <VenuePin
              key={venue.id}
              venue={{...venue, map_coordinates: coords}}
              stopNumber={stopNumber}
              isFavorited={isFavorited}
              isActive={activeVenue === venue.id}
              onClick={() => handleVenueClick(venue)}
            />
          )
        })}
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
