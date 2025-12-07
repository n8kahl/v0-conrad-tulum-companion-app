"use client"

import type { SiteVisit, Property, VisitStop, Venue, VenueType, VisitCapture, Asset } from "@/lib/supabase/types"
import { useMemo } from "react"
import { motion } from "framer-motion"
import { VenueHighlightCard } from "./venue-highlight-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AssetBundleStrip } from "@/components/public/asset-bundle-strip"
import {
  Calendar,
  Users,
  Building2,
  Heart,
  MapPin,
  Printer,
  Mail,
  FileText,
  CheckCircle2,
  Sparkles,
  Sunrise,
  Moon,
  Leaf,
  Utensils,
  TreePalm,
  Waves,
  PartyPopper,
  Briefcase,
  type LucideIcon,
} from "lucide-react"

interface ProgramScenario {
  id: string
  name: string
  description: string
  icon: LucideIcon
  color: string
  venueTypes: VenueType[]
  matchingStops: (VisitStop & { venue: Venue })[]
}

interface RecapViewProps {
  visit: SiteVisit
  stops: (VisitStop & { venue: Venue })[]
  property: Property | null
  captures: VisitCapture[]
  assets: Asset[]
}

// Derive program scenarios based on tour stops
function deriveScenarios(
  stops: (VisitStop & { venue: Venue })[]
): ProgramScenario[] {
  const scenarios: ProgramScenario[] = []

  // Wellness-focused scenario (spa, pool, outdoor, beach)
  const wellnessTypes: VenueType[] = ["spa", "pool", "beach", "outdoor"]
  const wellnessStops = stops.filter((s) =>
    wellnessTypes.includes(s.venue.venue_type)
  )
  if (wellnessStops.length >= 1) {
    scenarios.push({
      id: "wellness",
      name: "Wellness Retreat",
      description:
        "A rejuvenating journey focused on relaxation and renewal, featuring spa experiences and natural settings.",
      icon: Leaf,
      color: "text-emerald-600",
      venueTypes: wellnessTypes,
      matchingStops: wellnessStops,
    })
  }

  // Evening gala scenario (ballroom, restaurant, outdoor)
  const eveningTypes: VenueType[] = ["ballroom", "restaurant", "outdoor", "beach"]
  const eveningStops = stops.filter((s) =>
    eveningTypes.includes(s.venue.venue_type)
  )
  if (eveningStops.length >= 1) {
    scenarios.push({
      id: "gala",
      name: "Evening Gala",
      description:
        "An elegant evening celebration with stunning venues for cocktails, dinner, and dancing under the stars.",
      icon: Moon,
      color: "text-violet-600",
      venueTypes: eveningTypes,
      matchingStops: eveningStops,
    })
  }

  // Corporate meeting scenario (meeting_room, ballroom, lobby)
  const corporateTypes: VenueType[] = ["meeting_room", "ballroom", "lobby"]
  const corporateStops = stops.filter((s) =>
    corporateTypes.includes(s.venue.venue_type)
  )
  if (corporateStops.length >= 1) {
    scenarios.push({
      id: "corporate",
      name: "Executive Summit",
      description:
        "Professional spaces designed for productive meetings, strategic sessions, and team building.",
      icon: Briefcase,
      color: "text-blue-600",
      venueTypes: corporateTypes,
      matchingStops: corporateStops,
    })
  }

  // Beach celebration scenario (beach, outdoor, pool)
  const beachTypes: VenueType[] = ["beach", "outdoor", "pool"]
  const beachStops = stops.filter((s) => beachTypes.includes(s.venue.venue_type))
  if (beachStops.length >= 1 && !scenarios.find((s) => s.id === "wellness")) {
    scenarios.push({
      id: "beach",
      name: "Beachside Celebration",
      description:
        "Embrace the Caribbean spirit with oceanfront venues, tropical settings, and sunset views.",
      icon: TreePalm,
      color: "text-amber-600",
      venueTypes: beachTypes,
      matchingStops: beachStops,
    })
  }

  // Culinary experience (restaurant)
  const culinaryStops = stops.filter((s) => s.venue.venue_type === "restaurant")
  if (culinaryStops.length >= 2) {
    scenarios.push({
      id: "culinary",
      name: "Culinary Journey",
      description:
        "A gastronomic adventure through world-class dining venues with exceptional cuisine and ambiance.",
      icon: Utensils,
      color: "text-orange-600",
      venueTypes: ["restaurant"],
      matchingStops: culinaryStops,
    })
  }

  // Return top 3 scenarios with most matching stops
  return scenarios.sort((a, b) => b.matchingStops.length - a.matchingStops.length).slice(0, 3)
}

export function RecapView({ visit, stops, property, captures, assets }: RecapViewProps) {
  const favoritedStops = stops.filter((s) => s.client_favorited)
  const allStops = stops
  
  // Count actual tour photos from captures
  const tourPhotosCount = captures.filter(c => c.capture_type === "photo").length
  
  // Helper function to match assets by keywords
  const matchesKeywords = (asset: Asset, keywords: string[]) => {
    const searchText = `${asset.name} ${asset.description || ""} ${asset.tags?.join(" ") || ""}`.toLowerCase()
    return keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
  }

  // Derive program scenarios from stops
  const scenarios = useMemo(() => deriveScenarios(stops), [stops])

  const handlePrint = () => {
    window.print()
  }

  const handleRequestProposal = () => {
    const subject = encodeURIComponent(
      `Proposal Request - ${visit.client_company}`
    )
    const body = encodeURIComponent(
      `Hello,\n\nFollowing our site visit on ${
        visit.visit_date
          ? new Date(visit.visit_date).toLocaleDateString()
          : "recently"
      }, we would like to request a formal proposal for our ${
        visit.group_type
      } event.\n\nCompany: ${visit.client_company}\nEstimated Attendees: ${
        visit.estimated_attendees || "TBD"
      }\n\nFavorited Venues:\n${favoritedStops
        .map((s, i) => `${i + 1}. ${s.venue.name}`)
        .join("\n")}\n\nPlease reach out to discuss next steps.\n\nBest regards,\n${visit.client_contact.name}`
    )
    window.location.href = `mailto:groups@conradhotels.com?subject=${subject}&body=${body}`
  }

  return (
    <main className="px-6 py-8 max-w-4xl mx-auto print:max-w-none print:px-12">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="mb-8 print:shadow-none print:border-2">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Badge variant="secondary" className="mb-2">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Site Visit Complete
                </Badge>
                <h2 className="text-xl font-semibold text-foreground">
                  {visit.client_company}
                </h2>
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
                  <span>
                    {new Date(visit.visit_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Heart
                  className="h-4 w-4 text-primary"
                  fill="currentColor"
                />
                <span>{favoritedStops.length} favorited</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Program Scenarios Section */}
      {scenarios.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Program Scenarios
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Based on your tour, here are curated program ideas for your event:
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {scenarios.map((scenario, index) => (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ${scenario.color}`}
                      >
                        <scenario.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1">
                          {scenario.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {scenario.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {scenario.matchingStops.slice(0, 3).map((stop) => (
                            <Badge
                              key={stop.id}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {stop.venue.name}
                            </Badge>
                          ))}
                          {scenario.matchingStops.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              +{scenario.matchingStops.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Favorited Venues Section */}
      {favoritedStops.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-primary" fill="currentColor" />
            <h2 className="text-lg font-semibold text-foreground">
              Your Favorite Venues
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {favoritedStops.map((stop, index) => {
              const stopCaptures = captures.filter(c => c.visit_stop_id === stop.id)
              return (
                <motion.div
                  key={stop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                >
                  <VenueHighlightCard 
                    stop={stop} 
                    index={index} 
                    captures={stopCaptures}
                  />
                </motion.div>
              )
            })}
          </div>
        </motion.section>
      )}

      {/* All Tour Stops */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Complete Tour Route
          </h2>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {allStops.map((stop, index) => (
                <motion.div
                  key={stop.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">
                        {stop.venue.name}
                      </p>
                      {stop.client_favorited && (
                        <Heart
                          className="h-4 w-4 text-primary flex-shrink-0"
                          fill="currentColor"
                        />
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
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Tour Stats Summary */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mb-8"
      >
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Visit Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {allStops.length}
                </p>
                <p className="text-sm text-muted-foreground">Venues Toured</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {favoritedStops.length}
                </p>
                <p className="text-sm text-muted-foreground">Favorites</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {tourPhotosCount}
                </p>
                <p className="text-sm text-muted-foreground">Photos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {allStops.reduce(
                    (max, s) =>
                      Math.max(max, s.venue.capacities?.reception || 0),
                    0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Max Capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Planning Resources */}
      {assets.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Planning Resources
            </h2>
          </div>
          <div className="space-y-6">
            {matchesKeywords({ 
              name: "", 
              description: "", 
              tags: ["fact", "capacity", "chart"] 
            } as Asset, ["fact"]) && (
              <AssetBundleStrip
                title="Fact Sheets & Capacity Charts"
                assets={assets.filter(a => matchesKeywords(a, ["fact", "capacity", "chart", "venue", "space"]))}
                viewAllHref="/explore/assets?category=events"
              />
            )}
            {matchesKeywords({ 
              name: "", 
              description: "", 
              tags: ["map"] 
            } as Asset, ["map"]) && (
              <AssetBundleStrip
                title="Resort Maps & Guides"
                assets={assets.filter(a => matchesKeywords(a, ["map", "guide", "directory", "resort"]))}
                viewAllHref="/explore/assets?category=maps"
              />
            )}
            {matchesKeywords({ 
              name: "", 
              description: "", 
              tags: ["menu"] 
            } as Asset, ["menu"]) && (
              <AssetBundleStrip
                title="Menus & Culinary Experiences"
                assets={assets.filter(a => matchesKeywords(a, ["menu", "dining", "culinary", "catering"]))}
                viewAllHref="/explore/assets?category=dining"
              />
            )}
          </div>
        </motion.section>
      )}

      {/* Next Steps */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="mb-8 print:hidden"
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Next Steps
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                Review your favorited venues and share this recap with your
                team
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                Request a formal proposal with detailed pricing and
                availability
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                Schedule a follow-up call to discuss your event requirements
              </li>
            </ul>
            <Button
              className="mt-4 w-full sm:w-auto"
              onClick={handleRequestProposal}
            >
              <Mail className="h-4 w-4 mr-1.5" />
              Request Proposal Now
            </Button>
          </CardContent>
        </Card>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="pt-8 border-t border-border text-center print:pt-12"
      >
        <p className="text-sm text-muted-foreground">
          {property?.location?.address}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-2">
          &copy; {new Date().getFullYear()} Conrad Hotels & Resorts. All
          rights reserved.
        </p>
      </motion.footer>
    </main>
  )
}
