"use client"

import type { SiteVisit, Property, VisitStop, Venue } from "@/lib/supabase/types"
import { VenueHighlightCard } from "./venue-highlight-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Users,
  Building2,
  Heart,
  MapPin,
  Printer,
  Mail,
  FileText,
  CheckCircle2
} from "lucide-react"

interface RecapViewProps {
  visit: SiteVisit
  stops: (VisitStop & { venue: Venue })[]
  property: Property | null
}

export function RecapView({ visit, stops, property }: RecapViewProps) {
  const favoritedStops = stops.filter((s) => s.client_favorited)
  const allStops = stops
  const tourPhotosCount = stops.reduce((acc, s) => acc + (s.photos?.length || 0), 0)

  const handlePrint = () => {
    window.print()
  }

  const handleRequestProposal = () => {
    const subject = encodeURIComponent(`Proposal Request - ${visit.client_company}`)
    const body = encodeURIComponent(
      `Hello,\n\nFollowing our site visit on ${visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : 'recently'}, we would like to request a formal proposal for our ${visit.group_type} event.\n\nCompany: ${visit.client_company}\nEstimated Attendees: ${visit.estimated_attendees || 'TBD'}\n\nFavorited Venues:\n${favoritedStops.map((s, i) => `${i + 1}. ${s.venue.name}`).join('\n')}\n\nPlease reach out to discuss next steps.\n\nBest regards,\n${visit.client_contact.name}`
    )
    window.location.href = `mailto:groups@conradhotels.com?subject=${subject}&body=${body}`
  }

  return (
    <main className="px-6 py-8 max-w-4xl mx-auto print:max-w-none print:px-12">
      {/* Summary Card */}
      <Card className="mb-8 print:shadow-none print:border-2">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Site Visit Complete
              </Badge>
              <h2 className="text-xl font-semibold text-foreground">{visit.client_company}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Thank you for visiting Conrad Tulum Riviera Maya
              </p>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1.5" />
                Print
              </Button>
              <Button size="sm" onClick={handleRequestProposal}>
                <Mail className="h-4 w-4 mr-1.5" />
                Request Proposal
              </Button>
            </div>
          </div>

          {/* Visit Stats */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="capitalize">{visit.group_type}</span>
            </div>
            {visit.estimated_attendees && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span>{visit.estimated_attendees} attendees</span>
              </div>
            )}
            {visit.visit_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{new Date(visit.visit_date).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-primary" fill="currentColor" />
              <span>{favoritedStops.length} favorited</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favorited Venues Section */}
      {favoritedStops.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-primary" fill="currentColor" />
            <h2 className="text-lg font-semibold text-foreground">Your Favorite Venues</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {favoritedStops.map((stop, index) => (
              <VenueHighlightCard key={stop.id} stop={stop} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* All Tour Stops */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Complete Tour Route</h2>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {allStops.map((stop, index) => (
                <div key={stop.id} className="flex items-center gap-4 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{stop.venue.name}</p>
                      {stop.client_favorited && (
                        <Heart className="h-4 w-4 text-primary flex-shrink-0" fill="currentColor" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {stop.venue.venue_type.replace("_", " ")}
                      {stop.scheduled_time && ` • ${stop.scheduled_time}`}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {stop.venue.capacities?.reception && (
                      <span>{stop.venue.capacities.reception} guests</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tour Stats Summary */}
      <section className="mb-8">
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Visit Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{allStops.length}</p>
                <p className="text-sm text-muted-foreground">Venues Toured</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{favoritedStops.length}</p>
                <p className="text-sm text-muted-foreground">Favorites</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{tourPhotosCount}</p>
                <p className="text-sm text-muted-foreground">Photos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {allStops.reduce((max, s) => Math.max(max, s.venue.capacities?.reception || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Max Capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Next Steps */}
      <section className="mb-8 print:hidden">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Next Steps
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                Review your favorited venues and share this recap with your team
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                Request a formal proposal with detailed pricing and availability
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                Schedule a follow-up call to discuss your event requirements
              </li>
            </ul>
            <Button className="mt-4 w-full sm:w-auto" onClick={handleRequestProposal}>
              <Mail className="h-4 w-4 mr-1.5" />
              Request Proposal Now
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-border text-center print:pt-12">
        <p className="text-sm text-muted-foreground">{property?.location?.address}</p>
        <p className="text-xs text-muted-foreground/70 mt-2">
          &copy; {new Date().getFullYear()} Conrad Hotels & Resorts. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
