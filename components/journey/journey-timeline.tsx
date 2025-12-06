"use client"

import type { Property, Venue, VisitStop } from "@/lib/supabase/types"
import { JourneyStep } from "./journey-step"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plane,
  Car,
  UtensilsCrossed,
  Hotel,
  Sunrise,
  MapPin,
  Clock,
  Navigation,
} from "lucide-react"

interface JourneyTimelineProps {
  property: Property | null
  firstVenue?: Venue | null
  className?: string
}

export function JourneyTimeline({ property, firstVenue, className }: JourneyTimelineProps) {
  const airportCode = property?.location?.airport_code || "CUN"
  const transferTime = property?.location?.transfer_time || "2 hours from Cancun International Airport"

  // Extract just the time portion
  const transferDuration = transferTime.match(/(\d+\.?\d*)\s*(hours?|hrs?)/i)?.[0] || "2 hours"

  const journeySteps = [
    {
      icon: Plane,
      title: `Arrive at ${airportCode}`,
      description: "Cancun International Airport - Mexico's busiest tourist airport",
      duration: "Arrival",
    },
    {
      icon: Car,
      title: "Private Transfer",
      description: "Luxury vehicle through the scenic Riviera Maya coastline",
      duration: transferDuration,
    },
    {
      icon: UtensilsCrossed,
      title: "Welcome Refreshment",
      description: "Arrival drink at the Conrad Tulum lobby with ocean views",
      duration: "15 min",
    },
    {
      icon: Hotel,
      title: "Express Check-In",
      description: "Seamless registration with dedicated group services",
      duration: "10 min",
    },
    {
      icon: Sunrise,
      title: "Suite Orientation",
      description: "Freshen up and explore your accommodation",
      duration: "30 min",
    },
    {
      icon: MapPin,
      title: firstVenue ? `Site Tour Begins` : "Property Tour",
      description: firstVenue
        ? `Your tour starts at ${firstVenue.name}`
        : "Guided tour of event spaces and amenities",
      duration: "Start tour",
    },
  ]

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Gate-to-Gate Journey
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            ~3-4 hours total
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Your seamless arrival experience from {airportCode} to Conrad Tulum
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {journeySteps.map((step, index) => (
            <JourneyStep
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              duration={step.duration}
              index={index}
              isLast={index === journeySteps.length - 1}
            />
          ))}
        </div>

        {/* Transfer Options */}
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="font-medium text-foreground mb-3">Transfer Options</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium text-sm">Private SUV</p>
              <p className="text-xs text-muted-foreground mt-1">
                Exclusive vehicle for your group (up to 6 guests)
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium text-sm">Luxury Van</p>
              <p className="text-xs text-muted-foreground mt-1">
                Premium transport for larger groups (up to 12 guests)
              </p>
            </div>
          </div>
        </div>

        {/* Property Location */}
        {property?.location?.address && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-foreground">Conrad Tulum Riviera Maya</p>
                <p className="text-muted-foreground">{property.location.address}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
