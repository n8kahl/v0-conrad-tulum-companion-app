"use client"

import type { VisitStop, Venue } from "@/lib/supabase/types"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, Heart, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientAgendaViewProps {
  stops: (VisitStop & { venue: Venue })[]
  visitDate?: string | null
}

export function ClientAgendaView({ stops, visitDate }: ClientAgendaViewProps) {
  // Group stops by time (morning, afternoon, evening)
  const getTimeOfDay = (time: string | null): string => {
    if (!time) return "unscheduled"
    const hour = parseInt(time.split(":")[0])
    if (hour < 12) return "morning"
    if (hour < 17) return "afternoon"
    return "evening"
  }

  const stopsWithTime = stops.filter((s) => s.scheduled_time)
  const stopsWithoutTime = stops.filter((s) => !s.scheduled_time)

  // Calculate duration/end times
  const getEndTime = (stop: VisitStop): string | null => {
    if (!stop.scheduled_time) return null
    const duration = (stop as any).duration_minutes || 30
    const [hours, minutes] = stop.scheduled_time.split(":").map(Number)
    const totalMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMins = totalMinutes % 60
    return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`
  }

  if (stops.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">Your agenda is being prepared.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Tour Agenda
          </CardTitle>
          {visitDate && (
            <Badge variant="secondary">
              {new Date(visitDate).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[71px] top-0 bottom-0 w-px bg-border" />

          {/* Scheduled stops */}
          <div className="space-y-0">
            {stopsWithTime.map((stop, index) => {
              const endTime = getEndTime(stop)
              const duration = (stop as any).duration_minutes || 30

              return (
                <div key={stop.id} className="relative flex gap-4 pb-6">
                  {/* Time column */}
                  <div className="w-16 flex-shrink-0 text-right">
                    <p className="text-sm font-medium text-foreground">
                      {stop.scheduled_time}
                    </p>
                    {endTime && (
                      <p className="text-xs text-muted-foreground">{endTime}</p>
                    )}
                  </div>

                  {/* Dot */}
                  <div
                    className={cn(
                      "relative z-10 w-3 h-3 rounded-full border-2 mt-1.5",
                      stop.client_favorited
                        ? "bg-primary border-primary"
                        : "bg-background border-primary"
                    )}
                  />

                  {/* Content */}
                  <div className="flex-1 -mt-0.5">
                    <Card className="overflow-hidden">
                      <div className="flex">
                        {/* Image */}
                        {stop.venue.images?.[0] && (
                          <div className="relative w-20 h-20 flex-shrink-0 bg-muted hidden sm:block">
                            <Image
                              src={stop.venue.images[0]}
                              alt={stop.venue.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        {/* Details */}
                        <div className="flex-1 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium text-foreground text-sm">
                                {stop.venue.name}
                              </h4>
                              <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {stop.venue.venue_type.replace("_", " ")}
                              </p>
                            </div>
                            {stop.client_favorited && (
                              <Heart
                                className="h-4 w-4 text-primary flex-shrink-0"
                                fill="currentColor"
                              />
                            )}
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {duration} min
                            </Badge>
                            {stop.venue.capacities?.reception && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {stop.venue.capacities.reception}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Unscheduled stops */}
          {stopsWithoutTime.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Also on the tour:
              </p>
              <div className="space-y-2">
                {stopsWithoutTime.map((stop) => (
                  <div
                    key={stop.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{stop.venue.name}</span>
                    {stop.client_favorited && (
                      <Heart
                        className="h-3 w-3 text-primary"
                        fill="currentColor"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
