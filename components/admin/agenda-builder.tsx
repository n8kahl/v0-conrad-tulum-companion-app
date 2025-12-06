"use client"

import type { SiteVisit, VisitStop, Venue } from "@/lib/supabase/types"
import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { createClient } from "@/lib/supabase/client"
import { AgendaItem } from "./agenda-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Save, Printer, Coffee, Utensils, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AgendaBuilderProps {
  visit: SiteVisit
  stops: (VisitStop & { venue: Venue })[]
  onUpdate: (stops: (VisitStop & { venue: Venue })[]) => void
}

// Time slots for the agenda (8am to 8pm)
const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8
  return `${hour.toString().padStart(2, "0")}:00`
})

// Break templates
const BREAKS = [
  { label: "Coffee Break", duration: 15, icon: Coffee },
  { label: "Lunch", duration: 60, icon: Utensils },
  { label: "Refreshment Break", duration: 20, icon: Coffee },
]

export function AgendaBuilder({ visit, stops: initialStops, onUpdate }: AgendaBuilderProps) {
  const [stops, setStops] = useState(initialStops)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setStops((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order_index: index,
        }))
        return newItems
      })
    }
  }

  const handleTimeChange = (stopId: string, time: string) => {
    setStops((prev) =>
      prev.map((s) => (s.id === stopId ? { ...s, scheduled_time: time } : s))
    )
  }

  const handleDurationChange = (stopId: string, minutes: number) => {
    setStops((prev) =>
      prev.map((s) =>
        s.id === stopId ? { ...s, duration_minutes: minutes } as any : s
      )
    )
  }

  const handleRemoveStop = (stopId: string) => {
    setStops((prev) => prev.filter((s) => s.id !== stopId))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update all stops with new order and times
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i]
        const { error } = await supabase
          .from("visit_stops")
          .update({
            order_index: i,
            scheduled_time: stop.scheduled_time,
            updated_at: new Date().toISOString(),
          })
          .eq("id", stop.id)

        if (error) throw error
      }

      onUpdate(stops)
      toast.success("Agenda saved successfully")
    } catch (error) {
      console.error("Error saving agenda:", error)
      toast.error("Failed to save agenda")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Auto-fill times based on a starting time
  const autoFillTimes = (startTime: string) => {
    let currentMinutes =
      parseInt(startTime.split(":")[0]) * 60 +
      parseInt(startTime.split(":")[1])

    setStops((prev) =>
      prev.map((stop) => {
        const duration = (stop as any).duration_minutes || 30
        const hours = Math.floor(currentMinutes / 60)
        const mins = currentMinutes % 60
        const time = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
        currentMinutes += duration + 10 // 10 min transition between stops
        return { ...stop, scheduled_time: time }
      })
    )
  }

  // Calculate total duration
  const totalDuration = stops.reduce(
    (acc, s) => acc + ((s as any).duration_minutes || 30),
    0
  )
  const totalHours = Math.floor(totalDuration / 60)
  const totalMins = totalDuration % 60

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Tour Agenda
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Drag to reorder, set times and durations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Save Agenda
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Start tour at:</span>
              <select
                onChange={(e) => e.target.value && autoFillTimes(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                defaultValue=""
              >
                <option value="">Select time...</option>
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <Badge variant="secondary" className="text-sm">
              <Clock className="h-3 w-3 mr-1" />
              Total: {totalHours}h {totalMins}m
            </Badge>
            <Badge variant="outline" className="text-sm">
              {stops.length} stops
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Timeline View */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Agenda Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tour Stops</CardTitle>
          </CardHeader>
          <CardContent>
            {stops.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stops.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {stops.map((stop) => (
                      <AgendaItem
                        key={stop.id}
                        stop={stop}
                        onTimeChange={(time) => handleTimeChange(stop.id, time)}
                        onDurationChange={(mins) => handleDurationChange(stop.id, mins)}
                        onRemove={() => handleRemoveStop(stop.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No stops in this tour yet.</p>
                <p className="text-sm">Add venues from the visit detail page.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Visit Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Visit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Client:</span>{" "}
                {visit.client_company}
              </p>
              <p>
                <span className="text-muted-foreground">Type:</span>{" "}
                <span className="capitalize">{visit.group_type}</span>
              </p>
              {visit.estimated_attendees && (
                <p>
                  <span className="text-muted-foreground">Attendees:</span>{" "}
                  {visit.estimated_attendees}
                </p>
              )}
              {visit.visit_date && (
                <p>
                  <span className="text-muted-foreground">Date:</span>{" "}
                  {new Date(visit.visit_date).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Suggested Breaks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Suggested Breaks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {BREAKS.map((brk) => (
                <div
                  key={brk.label}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <brk.icon className="h-4 w-4" />
                  <span>{brk.label}</span>
                  <span className="text-xs">({brk.duration} min)</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">
                Breaks can be added as notes to each stop.
              </p>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <h4 className="font-medium text-sm mb-2">Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Drag items to reorder the tour</li>
                <li>Allow 10-15 min between venues for walking</li>
                <li>Schedule breaks every 2-3 hours</li>
                <li>Consider meal times (12-1pm, 6-7pm)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
