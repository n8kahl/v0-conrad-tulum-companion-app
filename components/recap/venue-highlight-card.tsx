"use client"

import type { VisitStop, Venue, VisitCapture } from "@/lib/supabase/types"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Users, Maximize2, MapPin, Camera, MessageSquare } from "lucide-react"
import { pickRecapHeroForVenue, computeVenueRecapStats } from "@/lib/recap/helpers"

interface VenueHighlightCardProps {
  stop: VisitStop & { venue: Venue }
  index: number
  captures: VisitCapture[]
}

// Helper to get hero image URL from venue media or fallback to legacy field
function getHeroImageUrl(venue: any): string | null {
  const toUrl = (path?: string | null) => {
    if (!path) return null
    return path.startsWith("http://") || path.startsWith("https://")
      ? path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${path}`
  }

  const heroMedia = venue.venue_media?.find(
    (vm: any) => vm.context === "hero" && vm.is_primary
  ) ?? venue.venue_media?.find(
    (vm: any) => vm.context === "hero"
  )
  
  const media = heroMedia?.media
  
  return (
    toUrl(media?.thumbnail_path) ??
    toUrl(media?.storage_path) ??
    venue.images?.[0] ??
    null
  )
}

export function VenueHighlightCard({ stop, index, captures }: VenueHighlightCardProps) {
  const venue = stop.venue
  
  // Use helper to pick best hero image (prioritizes tour captures)
  const { heroUrl, from } = pickRecapHeroForVenue({ venue, captures })
  
  // Compute capture statistics
  const stats = computeVenueRecapStats({ 
    captures, 
    isFavorited: stop.client_favorited 
  })
  
  // Keep legacy helper for backwards compatibility
  const heroImageUrl = heroUrl || getHeroImageUrl(venue)

  return (
    <Card className="overflow-hidden print:break-inside-avoid">
      <div className="relative">
        {/* Image Gallery */}
        <div className="relative aspect-[16/9] bg-muted">
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt={venue.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Favorited Badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-primary-foreground gap-1">
              <Heart className="h-3 w-3" fill="currentColor" />
              Favorited
            </Badge>
          </div>

          {/* Stop Number */}
          <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground text-sm font-semibold shadow-md">
            {index + 1}
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{venue.name}</h3>
              <p className="text-sm text-muted-foreground capitalize mt-0.5">
                {venue.venue_type.replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Description */}
          {venue.description && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
              {venue.description}
            </p>
          )}

          {/* Capture Stats */}
          {stats.hasCaptures && (
            <div className="mt-3 flex items-center gap-3 text-sm text-primary bg-primary/5 rounded-md px-3 py-2">
              {stats.photoCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Camera className="h-4 w-4" />
                  <span className="font-medium">{stats.photoCount}</span>
                  <span className="text-muted-foreground">
                    {stats.photoCount === 1 ? "photo" : "photos"}
                  </span>
                </span>
              )}
              {stats.noteCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">{stats.noteCount}</span>
                  <span className="text-muted-foreground">
                    {stats.noteCount === 1 ? "note" : "notes"}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Key Stats */}
          <div className="mt-4 flex flex-wrap gap-3">
            {venue.dimensions?.sqm && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Maximize2 className="h-4 w-4" />
                <span>{venue.dimensions.sqm} m²</span>
              </div>
            )}
            {venue.capacities?.reception && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{venue.capacities.reception} reception</span>
              </div>
            )}
            {venue.capacities?.banquet && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{venue.capacities.banquet} banquet</span>
              </div>
            )}
          </div>

          {/* Features */}
          {venue.features && venue.features.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {venue.features.slice(0, 5).map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs capitalize">
                  {feature.replace(/_/g, " ")}
                </Badge>
              ))}
              {venue.features.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{venue.features.length - 5} more
                </Badge>
              )}
            </div>
          )}

          {/* Tour Photos */}
          {stop.photos && stop.photos.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Camera className="h-3 w-3" />
                Tour Photos
              </p>
              <div className="flex gap-2 overflow-x-auto">
                {stop.photos.map((photo, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                    <Image
                      src={photo}
                      alt={`Tour photo ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Reaction */}
          {stop.client_reaction && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Your Feedback</p>
              <p className="text-sm text-foreground italic">&quot;{stop.client_reaction}&quot;</p>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
