"use client"

import type { SiteVisit, Property, VisitStop, Venue, Asset } from "@/lib/supabase/types"
import { useState, useMemo } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, MapPin, Heart, ChevronRight, Building2, FileText, Map, Navigation, Play, Sparkles, ExternalLink } from "lucide-react"
import Link from "next/link"
import { ResortMap } from "@/components/map/resort-map"
import { JourneyTimeline } from "@/components/journey/journey-timeline"
import { TourMode } from "./tour-mode"
import { AssetCard } from "@/components/public/asset-card"

interface ClientVisitViewProps {
  visit: SiteVisit
  stops: (VisitStop & { venue: Venue })[]
  property: Property | null
  assets: Asset[]
}

export function ClientVisitView({ visit, stops: initialStops, property, assets }: ClientVisitViewProps) {
  const [stops, setStops] = useState(initialStops)
  const [activeStop, setActiveStop] = useState<string | null>(null)
  const [isTourMode, setIsTourMode] = useState(false)

  // Group assets into curated resource bundles
  const resourceGroups = useMemo(() => {
    const essentialKeywords = ['general', 'fact', 'official', 'website', 'overview', 'brochure']
    const planningKeywords = ['event', 'meeting', 'resort map', 'cvent', 'calculator', 'capacity', 'floorplan']
    const experienceKeywords = ['menu', 'f&b', 'dining', 'spa', 'activities', 'tropical', 'inspire']

    const matchesKeywords = (asset: Asset, keywords: string[]) => {
      const searchText = `${asset.name} ${asset.description || ''} ${asset.category}`.toLowerCase()
      return keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
    }

    const essential = assets.filter(a => matchesKeywords(a, essentialKeywords)).slice(0, 5)
    const planning = assets.filter(a => matchesKeywords(a, planningKeywords) && !essential.includes(a)).slice(0, 5)
    const experience = assets.filter(a => matchesKeywords(a, experienceKeywords) && !essential.includes(a) && !planning.includes(a)).slice(0, 5)

    return [
      { title: 'Essential Facts', description: 'Key information about the resort', assets: essential },
      { title: 'Event Planning Tools', description: 'Capacities, maps, and planning resources', assets: planning },
      { title: 'Menus & Experiences', description: 'Dining options and guest activities', assets: experience },
    ].filter(group => group.assets.length > 0)
  }, [assets])

  const handleStopUpdate = (stopId: string, updates: Partial<VisitStop>) => {
    setStops(stops.map((s) => (s.id === stopId ? { ...s, ...updates } : s)))
  }

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

  // Render Tour Mode if active
  if (isTourMode) {
    return (
      <TourMode
        stops={stops}
        onStopUpdate={handleStopUpdate}
        onClose={() => setIsTourMode(false)}
      />
    )
  }

  return (
    <main className="px-6 py-8 max-w-2xl mx-auto">
      {/* Start Tour Button */}
      {stops.length > 0 && (
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Ready to explore?</p>
                <p className="text-sm text-muted-foreground">
                  Start interactive tour mode for the best experience
                </p>
              </div>
              <Button onClick={() => setIsTourMode(true)}>
                <Play className="h-4 w-4 mr-1.5" />
                Start Tour
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <Heart className="inline h-4 w-4 text-primary mr-1" fill="currentColor" />
                You&apos;ve favorited {favoriteCount} venue{favoriteCount !== 1 ? "s" : ""}
              </p>
              <Link href={`/recap/${visit.share_token}`}>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1.5" />
                  View Recap
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resort Map */}
      {stops.length > 0 && (
        <section className="mb-8">
          <ResortMap
            venues={stops.map((s) => s.venue)}
            stops={stops}
            showTourRoute={true}
          />
        </section>
      )}

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

      {/* Journey Timeline */}
      <section className="mt-8">
        <JourneyTimeline
          property={property}
          firstVenue={stops[0]?.venue || null}
        />
      </section>

      {/* Resources for Your Program */}
      {resourceGroups.length > 0 && (
        <section className="mt-12">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-light text-foreground">Resources for Your Program</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Fact sheets, maps, menus and tools curated for your visit
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Anything you favorite during the tour will appear in your recap
            </p>
          </div>

          <div className="space-y-6">
            {resourceGroups.map((group, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center justify-between">
                    <div>
                      <span>{group.title}</span>
                      <p className="text-xs text-muted-foreground font-normal mt-1">
                        {group.description}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {group.assets.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative -mx-2">
                    <div className="flex gap-3 overflow-x-auto pb-2 px-2 scrollbar-thin snap-x snap-mandatory">
                      {group.assets.map((asset) => (
                        <div
                          key={asset.id}
                          className="flex-shrink-0 w-[240px] snap-start"
                        >
                          <AssetCard asset={asset} variant="compact" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {assets.length > 15 && (
            <div className="mt-4 text-center">
              <Link href="/explore" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <FileText className="h-4 w-4" />
                View full Content Library
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Quick Links */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href={`/journey/${visit.share_token}`}
          className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="p-2 rounded-full bg-primary/10">
            <Navigation className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">Full Journey View</p>
            <p className="text-xs text-muted-foreground">Gate-to-gate arrival experience</p>
          </div>
        </Link>
        <Link
          href={`/recap/${visit.share_token}`}
          className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="p-2 rounded-full bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">Visit Recap</p>
            <p className="text-xs text-muted-foreground">Summary and favorited venues</p>
          </div>
        </Link>
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">{property?.location?.address}</p>
        <p className="text-xs text-muted-foreground/70 mt-2">© {new Date().getFullYear()} Conrad Hotels & Resorts</p>
      </footer>
    </main>
  )
}
