"use client"

import type { VisitStop, Venue } from "@/lib/supabase/types"
import { useState, useEffect } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ReactionPicker } from "./reaction-picker"
import {
  Play,
  Pause,
  SkipForward,
  Heart,
  MapPin,
  Clock,
  MessageSquare,
  X,
  Check,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface TourModeProps {
  stops: (VisitStop & { venue: Venue })[]
  onStopUpdate: (stopId: string, updates: Partial<VisitStop>) => void
  onClose: () => void
}

export function TourMode({ stops, onStopUpdate, onClose }: TourModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [clientNotes, setClientNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [reactions, setReactions] = useState<string[]>([])
  const supabase = createClient()

  const currentStop = stops[currentIndex]
  const progress = ((currentIndex + 1) / stops.length) * 100

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedTime((t) => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  // Load existing notes/reactions when stop changes
  useEffect(() => {
    setClientNotes(currentStop?.client_reaction || "")
    // Client reactions would be stored separately if we extended the schema
    setReactions([])
  }, [currentIndex, currentStop])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleNext = () => {
    if (currentIndex < stops.length - 1) {
      setCurrentIndex((i) => i + 1)
      setElapsedTime(0)
    } else {
      // Tour complete
      setIsPlaying(false)
      toast.success("Tour complete!")
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setElapsedTime(0)
    }
  }

  const handleFavorite = async () => {
    const newFavorited = !currentStop.client_favorited
    const { error } = await supabase
      .from("visit_stops")
      .update({ client_favorited: newFavorited })
      .eq("id", currentStop.id)

    if (!error) {
      onStopUpdate(currentStop.id, { client_favorited: newFavorited })
      toast.success(newFavorited ? "Added to favorites" : "Removed from favorites")
    }
  }

  const handleSaveNotes = async () => {
    const { error } = await supabase
      .from("visit_stops")
      .update({ client_reaction: clientNotes })
      .eq("id", currentStop.id)

    if (!error) {
      onStopUpdate(currentStop.id, { client_reaction: clientNotes })
      setShowNotes(false)
      toast.success("Notes saved")
    }
  }

  const handleReactionToggle = (reaction: string) => {
    setReactions((prev) =>
      prev.includes(reaction)
        ? prev.filter((r) => r !== reaction)
        : [...prev, reaction]
    )
    // In a full implementation, this would save to database
  }

  if (!currentStop) return null

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm font-medium">Tour Mode</p>
              <p className="text-xs text-muted-foreground">
                Stop {currentIndex + 1} of {stops.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(elapsedTime)}
            </Badge>
            <Button
              variant={isPlaying ? "secondary" : "default"}
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-24 overflow-y-auto" style={{ height: "calc(100vh - 140px)" }}>
        {/* Venue Image */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-4">
          {currentStop.venue.images?.[0] ? (
            <Image
              src={currentStop.venue.images[0]}
              alt={currentStop.venue.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Favorite button overlay */}
          <button
            onClick={handleFavorite}
            className="absolute top-4 right-4 p-3 rounded-full bg-background/80 backdrop-blur-sm shadow-lg transition-transform hover:scale-110"
          >
            <Heart
              className={cn(
                "h-6 w-6 transition-colors",
                currentStop.client_favorited
                  ? "text-primary fill-primary"
                  : "text-foreground"
              )}
            />
          </button>
        </div>

        {/* Venue Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{currentStop.venue.name}</h2>
                <p className="text-muted-foreground capitalize flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {currentStop.venue.venue_type.replace("_", " ")}
                </p>
              </div>
              <ReactionPicker
                selectedReactions={reactions}
                onReactionToggle={handleReactionToggle}
              />
            </div>

            {/* Capacity */}
            {currentStop.venue.capacities && (
              <div className="mt-4 flex flex-wrap gap-2">
                {currentStop.venue.capacities.reception && (
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {currentStop.venue.capacities.reception} reception
                  </Badge>
                )}
                {currentStop.venue.capacities.banquet && (
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {currentStop.venue.capacities.banquet} banquet
                  </Badge>
                )}
              </div>
            )}

            {/* Description */}
            {currentStop.venue.description && (
              <p className="mt-4 text-sm text-muted-foreground">
                {currentStop.venue.description}
              </p>
            )}

            {/* Features */}
            {currentStop.venue.features && currentStop.venue.features.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1">
                {currentStop.venue.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs capitalize">
                    {feature.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Your Notes
              </h3>
              {showNotes ? (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowNotes(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveNotes}>
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotes(true)}
                >
                  {clientNotes ? "Edit" : "Add Notes"}
                </Button>
              )}
            </div>

            {showNotes ? (
              <Textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="What do you think about this venue? Any questions or ideas?"
                rows={4}
              />
            ) : clientNotes ? (
              <p className="text-sm text-muted-foreground italic">
                &quot;{clientNotes}&quot;
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tap &quot;Add Notes&quot; to record your thoughts about this venue.
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1"
          >
            {currentIndex === stops.length - 1 ? (
              "Complete Tour"
            ) : (
              <>
                Next Stop
                <SkipForward className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}
