"use client"

import { useState } from "react"
import type { Property, Venue, VisitStop, VenueType } from "@/lib/supabase/types"
import { motion } from "framer-motion"
import { JourneyStep } from "./journey-step"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Plane,
  Car,
  UtensilsCrossed,
  Hotel,
  Sunrise,
  MapPin,
  Clock,
  Navigation,
  TreePalm,
  Waves,
  Building2,
  Sparkles,
  Coffee,
  type LucideIcon,
} from "lucide-react"

// Venue type to icon mapping
const venueTypeIcons: Record<VenueType, LucideIcon> = {
  property: Hotel,
  building: Building2,
  floor: Building2,
  space: MapPin,
  meeting_room: Building2,
  outdoor: TreePalm,
  restaurant: UtensilsCrossed,
  spa: Sparkles,
  pool: Waves,
  lobby: Hotel,
  ballroom: Building2,
  beach: TreePalm,
}

interface JourneyTimelineProps {
  property: Property | null
  firstVenue?: Venue | null
  stops?: (VisitStop & { venue: Venue })[]
  currentStep?: number
  onStepClick?: (index: number) => void
  className?: string
}

interface JourneyStepData {
  icon: LucideIcon
  title: string
  description: string
  duration: string
  venueType?: VenueType
}

export function JourneyTimeline({
  property,
  firstVenue,
  stops,
  currentStep = -1,
  onStepClick,
  className,
}: JourneyTimelineProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)

  const airportCode = property?.location?.airport_code || "CUN"
  const transferTime =
    property?.location?.transfer_time || "2 hours from Cancun International Airport"
  const transferDuration =
    transferTime.match(/(\d+\.?\d*)\s*(hours?|hrs?)/i)?.[0] || "2 hours"

  // Base arrival journey steps
  const arrivalSteps: JourneyStepData[] = [
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
      icon: Coffee,
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
  ]

  // Add tour stops if provided
  const tourSteps: JourneyStepData[] = stops
    ? stops.map((stop) => ({
        icon: venueTypeIcons[stop.venue.venue_type] || MapPin,
        title: stop.venue.name,
        description:
          stop.venue.description ||
          `${stop.venue.venue_type.replace("_", " ")} venue`,
        duration: stop.scheduled_time || "Tour stop",
        venueType: stop.venue.venue_type,
      }))
    : [
        {
          icon: MapPin,
          title: firstVenue ? "Site Tour Begins" : "Property Tour",
          description: firstVenue
            ? `Your tour starts at ${firstVenue.name}`
            : "Guided tour of event spaces and amenities",
          duration: "Start tour",
        },
      ]

  const allSteps = [...arrivalSteps, ...tourSteps]
  const totalSteps = allSteps.length
  const progressPercent =
    currentStep >= 0 ? ((currentStep + 1) / totalSteps) * 100 : 0

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
            {stops ? `${totalSteps} stops` : "~3-4 hours total"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Your seamless arrival experience from {airportCode} to Conrad Tulum
        </p>
      </CardHeader>
      <CardContent>
        {/* Animated Progress Bar */}
        {currentStep >= 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Journey Progress</span>
              <span>
                {currentStep + 1} of {totalSteps}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Timeline Steps */}
        <div className="relative">
          {/* Vertical progress line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
          {currentStep >= 0 && (
            <motion.div
              className="absolute left-5 top-0 w-px bg-primary"
              initial={{ height: 0 }}
              animate={{
                height: `${Math.min(
                  ((currentStep + 0.5) / (totalSteps - 1)) * 100,
                  100
                )}%`,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}

          <div className="space-y-0">
            {allSteps.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = currentStep >= 0 && index < currentStep
              const isClickable = onStepClick !== undefined
              const isTourStop = index >= arrivalSteps.length

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={cn(
                    "relative",
                    isClickable && "cursor-pointer"
                  )}
                  onClick={() => isClickable && onStepClick(index)}
                  onMouseEnter={() => setHoveredStep(index)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  {/* Step indicator dot */}
                  <motion.div
                    className={cn(
                      "absolute left-3 top-4 z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all duration-300",
                      isActive
                        ? "border-primary bg-primary scale-125"
                        : isCompleted
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30 bg-background"
                    )}
                    animate={
                      isActive
                        ? {
                            boxShadow: [
                              "0 0 0 0 rgba(196, 160, 82, 0)",
                              "0 0 0 8px rgba(196, 160, 82, 0.2)",
                              "0 0 0 0 rgba(196, 160, 82, 0)",
                            ],
                          }
                        : {}
                    }
                    transition={
                      isActive
                        ? { duration: 1.5, repeat: Infinity }
                        : undefined
                    }
                  >
                    {isCompleted && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="h-1.5 w-1.5 rounded-full bg-white"
                      />
                    )}
                  </motion.div>

                  {/* Step content */}
                  <div
                    className={cn(
                      "ml-10 pb-6 transition-all duration-200",
                      hoveredStep === index && "translate-x-1",
                      isActive && "pl-2 border-l-2 border-primary ml-9"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-start gap-3 rounded-lg p-3 -ml-3 transition-colors",
                        isActive && "bg-primary/5",
                        isClickable &&
                          hoveredStep === index &&
                          !isActive &&
                          "bg-muted/50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isCompleted
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={cn(
                              "font-medium text-sm",
                              isActive
                                ? "text-foreground"
                                : "text-foreground/80"
                            )}
                          >
                            {step.title}
                          </h4>
                          {isTourStop && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              Tour
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {step.description}
                        </p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "mt-2 text-[10px]",
                            isActive && "bg-primary/10 text-primary"
                          )}
                        >
                          <Clock className="h-2.5 w-2.5 mr-1" />
                          {step.duration}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Transfer Options */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 pt-6 border-t border-border"
        >
          <h4 className="font-medium text-foreground mb-3">Transfer Options</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <p className="font-medium text-sm">Private SUV</p>
              <p className="text-xs text-muted-foreground mt-1">
                Exclusive vehicle for your group (up to 6 guests)
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <p className="font-medium text-sm">Luxury Van</p>
              <p className="text-xs text-muted-foreground mt-1">
                Premium transport for larger groups (up to 12 guests)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Property Location */}
        {property?.location?.address && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 pt-6 border-t border-border"
          >
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-foreground">Conrad Tulum Riviera Maya</p>
                <p className="text-muted-foreground">
                  {property.location.address}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
