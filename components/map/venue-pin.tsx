"use client"

import type { Venue, VisitStop } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"
import { Heart, MapPin } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface VenuePinProps {
  venue: Venue
  stopNumber?: number
  isFavorited?: boolean
  isActive?: boolean
  onClick?: () => void
  className?: string
}

export function VenuePin({
  venue,
  stopNumber,
  isFavorited = false,
  isActive = false,
  onClick,
  className
}: VenuePinProps) {
  const x = venue.map_coordinates?.x ?? 50
  const y = venue.map_coordinates?.y ?? 50

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-200",
              "hover:z-20 hover:scale-110",
              isActive && "z-20 scale-110",
              className
            )}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div
              className={cn(
                "relative flex items-center justify-center",
                "w-8 h-8 rounded-full shadow-lg border-2",
                "transition-colors duration-200",
                isActive
                  ? "bg-primary border-primary text-primary-foreground"
                  : isFavorited
                    ? "bg-red-500 border-red-400 text-white"
                    : "bg-background border-primary text-primary"
              )}
            >
              {stopNumber !== undefined ? (
                <span className="text-xs font-bold">{stopNumber}</span>
              ) : (
                <MapPin className="h-4 w-4" />
              )}

              {/* Favorited indicator */}
              {isFavorited && stopNumber !== undefined && (
                <Heart
                  className="absolute -top-1 -right-1 h-3 w-3 text-red-500"
                  fill="currentColor"
                />
              )}
            </div>

            {/* Pulse animation for active pin */}
            {isActive && (
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-medium text-sm">{venue.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {venue.venue_type.replace("_", " ")}
            </p>
            {venue.capacities?.reception && (
              <Badge variant="secondary" className="text-xs">
                {venue.capacities.reception} guests
              </Badge>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
