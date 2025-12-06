"use client"

import type { SiteVisit, Property, VisitStop, Venue } from "@/lib/supabase/types"
import { useState } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MapPin, Heart, ChevronRight, Building2 } from "lucide-react"

interface ClientVisitViewProps {
  visit: SiteVisit
  stops: (VisitStop & { venue: Venue })[]
  property: Property | null
}

export function ClientVisitView({ visit, stops: initialStops, property }: ClientVisitViewProps) {
  const [stops, setStops] = useState(initialStops)
  const [activeStop, setActiveStop] = useState<string | null>(null)

  const toggleFavorite = async (stopId: string) => {
    const supabase = createClient()
    const stop = stops.find((s) => s.id === stopId)
    if (!stop) return

    const { error } = await supabase
      .from("visit_stops")
      .update({ client_favorited: !stop.client_favorited })
      .eq("id", stopId)

    if (!error) {
      setStops(stops.map((s) => (s.id === stopId ? { ...s, client_favorited: !s.client_favorited } : s)))
    }
  }

  const favoriteCount = stops.filter((s) => s.client_favorited).length

  return (
    <main className="px-6 py-8 max-w-2xl mx-auto">
      {/* Visit Summary */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="capitalize">{visit.group_type}</span>
            </div>
            {visit.estimated_attendees && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{visit.estimated_attendees} attendees</span>
              </div>
            )}
            {visit.visit_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(visit.visit_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          {favoriteCount > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <Heart className="inline h-4 w-4 text-primary mr-1" fill="currentColor" />
                You&apos;ve favorited {favoriteCount} venue{favoriteCount !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tour Itinerary */}
      <section>
        <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Your Tour Itinerary
        </h2>

        {stops.length > 0 ? (
          <div className="space-y-4">
            {stops.map((stop, index) => (
              <Card
                key={stop.id}
                className={`overflow-hidden transition-all cursor-pointer ${activeStop === stop.id ? "ring-2 ring-primary" : "hover:shadow-md"}`}
                onClick={() => setActiveStop(activeStop === stop.id ? null : stop.id)}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Image */}
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-muted">
                      {stop.venue?.images?.[0] ? (
                        <Image
                          src={stop.venue.images[0] || "/placeholder.svg"}
                          alt={stop.venue.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <MapPin className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      {/* Stop Number */}
                      <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        {index + 1}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-foreground">{stop.venue?.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {stop.venue?.venue_type.replace("_", " ")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(stop.id)
                          }}
                        >
                          <Heart
                            className={`h-5 w-5 transition-colors ${stop.client_favorited ? "text-primary fill-primary" : "text-muted-foreground"}`}
                          />
                        </Button>
                      </div>

                      {/* Capacity Badges */}
                      {stop.venue?.capacities && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {stop.venue.capacities.reception && (
                            <Badge variant="outline" className="text-xs">
                              Reception: {stop.venue.capacities.reception}
                            </Badge>
                          )}
                          {stop.venue.capacities.banquet && (
                            <Badge variant="outline" className="text-xs">
                              Banquet: {stop.venue.capacities.banquet}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <ChevronRight
                      className={`h-5 w-5 text-muted-foreground self-center mr-4 transition-transform ${activeStop === stop.id ? "rotate-90" : ""}`}
                    />
                  </div>

                  {/* Expanded Details */}
                  {activeStop === stop.id && (
                    <div className="px-4 pb-4 border-t border-border bg-muted/30">
                      <div className="pt-4 space-y-3">
                        {stop.venue?.description && (
                          <p className="text-sm text-muted-foreground">{stop.venue.description}</p>
                        )}
                        {stop.venue?.features && stop.venue.features.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {stop.venue.features.map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs capitalize">
                                {feature.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {stop.venue?.dimensions?.sqm && (
                          <p className="text-sm text-muted-foreground">
                            Area: {stop.venue.dimensions.sqm} m<sup>2</sup>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">Your tour itinerary is being prepared.</p>
              <p className="text-sm text-muted-foreground mt-1">Check back soon for venue details.</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">{property?.location?.address}</p>
        <p className="text-xs text-muted-foreground/70 mt-2">© {new Date().getFullYear()} Conrad Hotels & Resorts</p>
      </footer>
    </main>
  )
}
