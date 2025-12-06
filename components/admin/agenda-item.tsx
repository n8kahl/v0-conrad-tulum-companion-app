"use client"

import type { VisitStop, Venue } from "@/lib/supabase/types"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Clock, MapPin, Users, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AgendaItemProps {
  stop: VisitStop & { venue: Venue }
  onTimeChange: (time: string) => void
  onDurationChange: (minutes: number) => void
  onRemove: () => void
  isDragging?: boolean
}

export function AgendaItem({
  stop,
  onTimeChange,
  onDurationChange,
  onRemove,
  isDragging = false,
}: AgendaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: stop.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Calculate end time
  const duration = (stop as any).duration_minutes || 30
  const getEndTime = () => {
    if (!stop.scheduled_time) return null
    const [hours, minutes] = stop.scheduled_time.split(":").map(Number)
    const totalMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMins = totalMinutes % 60
    return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`
  }

  const endTime = getEndTime()

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={cn(
          "transition-all",
          isDragging && "ring-2 ring-primary shadow-lg opacity-90"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="mt-1 p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-foreground">{stop.venue.name}</h4>
                  <p className="text-sm text-muted-foreground capitalize flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {stop.venue.venue_type.replace("_", " ")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={onRemove}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Time & Duration */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={stop.scheduled_time || ""}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="w-28 h-8 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">for</span>
                  <select
                    value={duration}
                    onChange={(e) => onDurationChange(parseInt(e.target.value))}
                    className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                {endTime && stop.scheduled_time && (
                  <span className="text-sm text-muted-foreground">
                    ends at {endTime}
                  </span>
                )}
              </div>

              {/* Capacity info */}
              {stop.venue.capacities && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {stop.venue.capacities.reception && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {stop.venue.capacities.reception}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
