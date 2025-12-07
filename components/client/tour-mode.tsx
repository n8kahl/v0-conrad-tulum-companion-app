"use client"

import type { VisitStop, Venue, SiteVisit } from "@/lib/supabase/types"
import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ReactionPicker } from "./reaction-picker"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  MapPin,
  Clock,
  MessageSquare,
  X,
  Check,
  Users,
  Map,
  Sparkles,
  Building2,
  TreePalm,
  UtensilsCrossed,
  Waves,
  Hotel,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { VenueType } from "@/lib/supabase/types"

// Venue type to icon mapping
const venueTypeIcons: Record<VenueType, LucideIcon> = {
  meeting_room: Building2,
  outdoor: TreePalm,
  restaurant: UtensilsCrossed,
  spa: Sparkles,
  pool: Waves,
  lobby: Hotel,
  ballroom: Building2,
  beach: TreePalm,
}

// Venue type descriptions for voice guidance
const venueTypeDescriptions: Record<VenueType, string> = {
  meeting_room: "a professional meeting space perfect for conferences and presentations",
  outdoor: "a stunning outdoor venue surrounded by tropical gardens",
  restaurant: "an exceptional dining venue offering world-class cuisine",
  spa: "a tranquil wellness sanctuary for relaxation and rejuvenation",
  pool: "a luxurious poolside setting with refreshing Caribbean vibes",
  lobby: "an elegant reception area showcasing Conrad's signature hospitality",
  ballroom: "a grand ballroom designed for memorable celebrations",
  beach: "a pristine beachfront location with breathtaking ocean views",
}

interface TourModeProps {
  visit?: SiteVisit | null
  stops: (VisitStop & { venue: Venue })[]
  onStopUpdate: (stopId: string, updates: Partial<VisitStop>) => void
  onClose: () => void
  onShowMapForVenue?: (venueId: string) => void
}

export function TourMode({
  visit,
  stops,
  onStopUpdate,
  onClose,
  onShowMapForVenue,
}: TourModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [clientNotes, setClientNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [reactions, setReactions] = useState<string[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const supabase = createClient()

  const currentStop = stops[currentIndex]
  const progress = ((currentIndex + 1) / stops.length) * 100
  const VenueIcon = currentStop
    ? venueTypeIcons[currentStop.venue.venue_type] || MapPin
    : MapPin

  // Check for speech synthesis support on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSpeechSupported(true)
    }
  }, [])

  // Speech synthesis helper
  const speak = useCallback(
    (text: string) => {
      if (!speechSupported || typeof window === "undefined") {
        toast.error("Voice guidance is not supported in this browser")
        return
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1

      // Try to find a good English voice
      const voices = window.speechSynthesis.getVoices()
      const englishVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          (voice.name.includes("Female") ||
            voice.name.includes("Samantha") ||
            voice.name.includes("Karen"))
      )
      if (englishVoice) {
        utterance.voice = englishVoice
      }

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => {
        setIsSpeaking(false)
        toast.error("Voice guidance encountered an error")
      }

      window.speechSynthesis.speak(utterance)
    },
    [speechSupported]
  )

  // Stop speech when component unmounts or stop changes
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [currentIndex])

  // Generate voice guidance text for a venue
  const generateVoiceGuidance = useCallback(
    (venue: Venue): string => {
      const venueType = venue.venue_type
      const typeDescription =
        venueTypeDescriptions[venueType] || "a unique venue"

      let guidance = `Welcome to ${venue.name}. This is ${typeDescription}.`

      // Add capacity info
      if (venue.capacities) {
        const { reception, banquet, theater } = venue.capacities
        if (reception) {
          guidance += ` It can accommodate up to ${reception} guests for a reception style event.`
        } else if (banquet) {
          guidance += ` It can host up to ${banquet} guests for a seated dinner.`
        } else if (theater) {
          guidance += ` It can seat up to ${theater} guests in theater configuration.`
        }
      }

      // Add description excerpt if available
      if (venue.description) {
        const shortDescription = venue.description.split(".")[0]
        guidance += ` ${shortDescription}.`
      }

      return guidance
    },
    []
  )

  const handlePlayVoiceGuidance = useCallback(() => {
    if (!currentStop) return

    if (isSpeaking) {
      // Stop current speech
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
      setIsSpeaking(false)
    } else {
      const guidanceText = generateVoiceGuidance(currentStop.venue)
      speak(guidanceText)
    }
  }, [currentStop, isSpeaking, generateVoiceGuidance, speak])

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
    setReactions([])
  }, [currentIndex, currentStop])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleNext = () => {
    // Stop any ongoing speech
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)

    if (currentIndex < stops.length - 1) {
      setCurrentIndex((i) => i + 1)
      setElapsedTime(0)
    } else {
      setIsPlaying(false)
      toast.success("Tour complete!")
    }
  }

  const handlePrevious = () => {
    // Stop any ongoing speech
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)

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
      toast.success(
        newFavorited ? "Added to favorites" : "Removed from favorites"
      )
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
  }

  const handleViewOnMap = () => {
    if (onShowMapForVenue && currentStop) {
      onShowMapForVenue(currentStop.venue.id)
    }
  }

  if (!currentStop) return null

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Sticky Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border"
      >
        {/* Top bar with visit name and controls */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {visit?.client_company || "Site Tour"}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-primary">
                    Stop {currentIndex + 1}
                  </span>
                  <span>of {stops.length}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "font-mono transition-colors",
                  isPlaying && "bg-primary/10 text-primary"
                )}
              >
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(elapsedTime)}
              </Badge>
              <Button
                variant={isPlaying ? "secondary" : "default"}
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="gap-1"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">Start</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Current venue highlight bar */}
        <div className="px-4 py-2 bg-muted/50 border-t border-border/50">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                "bg-primary text-primary-foreground"
              )}
            >
              <VenueIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold truncate">
                {currentStop.venue.name}
              </h2>
              <p className="text-xs text-muted-foreground capitalize">
                {currentStop.venue.venue_type.replace("_", " ")}
                {currentStop.scheduled_time &&
                  ` • ${currentStop.scheduled_time}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Voice Guidance Button */}
              {speechSupported && (
                <Button
                  variant={isSpeaking ? "secondary" : "outline"}
                  size="sm"
                  onClick={handlePlayVoiceGuidance}
                  className={cn(
                    "gap-1.5 shrink-0",
                    isSpeaking && "bg-primary/10 text-primary border-primary/30"
                  )}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="h-4 w-4" />
                      <span className="hidden sm:inline">Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Listen</span>
                    </>
                  )}
                </Button>
              )}
              {onShowMapForVenue && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewOnMap}
                  className="gap-1.5 shrink-0"
                >
                  <Map className="h-4 w-4" />
                  <span className="hidden sm:inline">View on Map</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </motion.header>

      {/* Main Content */}
      <main
        className="overflow-y-auto px-4 py-4"
        style={{ height: "calc(100vh - 200px)" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Venue Image */}
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted mb-4">
              {currentStop.venue.images?.[0] ? (
                <Image
                  src={currentStop.venue.images[0]}
                  alt={currentStop.venue.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <VenueIcon className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}

              {/* Favorite button overlay */}
              <motion.button
                onClick={handleFavorite}
                whileTap={{ scale: 0.9 }}
                className="absolute top-4 right-4 p-3 rounded-full bg-background/80 backdrop-blur-sm shadow-lg transition-all hover:scale-110"
              >
                <Heart
                  className={cn(
                    "h-6 w-6 transition-colors",
                    currentStop.client_favorited
                      ? "text-primary fill-primary"
                      : "text-foreground"
                  )}
                />
              </motion.button>

              {/* Voice guidance floating button on image */}
              {speechSupported && (
                <motion.button
                  onClick={handlePlayVoiceGuidance}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "absolute top-4 left-4 p-3 rounded-full shadow-lg transition-all hover:scale-110",
                    isSpeaking
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/80 backdrop-blur-sm text-foreground"
                  )}
                >
                  {isSpeaking ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </motion.button>
              )}

              {/* Stop number badge */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-background/80 backdrop-blur-sm"
                >
                  Stop {currentIndex + 1} of {stops.length}
                </Badge>
                {currentStop.client_favorited && (
                  <Badge className="bg-primary/90 backdrop-blur-sm">
                    <Heart className="h-3 w-3 mr-1 fill-current" />
                    Favorited
                  </Badge>
                )}
              </div>
            </div>

            {/* Venue Details Card */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize">
                        {currentStop.venue.venue_type.replace("_", " ")}
                      </Badge>
                      {currentStop.venue.features?.slice(0, 2).map((feature) => (
                        <Badge
                          key={feature}
                          variant="secondary"
                          className="text-xs capitalize hidden sm:inline-flex"
                        >
                          {feature.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                    <ReactionPicker
                      selectedReactions={reactions}
                      onReactionToggle={handleReactionToggle}
                    />
                  </div>
                </div>

                {/* Capacity */}
                {currentStop.venue.capacities && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentStop.venue.capacities.reception && (
                      <Badge variant="outline" className="bg-muted/50">
                        <Users className="h-3 w-3 mr-1" />
                        {currentStop.venue.capacities.reception} reception
                      </Badge>
                    )}
                    {currentStop.venue.capacities.banquet && (
                      <Badge variant="outline" className="bg-muted/50">
                        <Users className="h-3 w-3 mr-1" />
                        {currentStop.venue.capacities.banquet} banquet
                      </Badge>
                    )}
                    {currentStop.venue.capacities.theater && (
                      <Badge variant="outline" className="bg-muted/50">
                        <Users className="h-3 w-3 mr-1" />
                        {currentStop.venue.capacities.theater} theater
                      </Badge>
                    )}
                  </div>
                )}

                {/* Description */}
                {currentStop.venue.description && (
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    {currentStop.venue.description}
                  </p>
                )}

                {/* All Features */}
                {currentStop.venue.features &&
                  currentStop.venue.features.length > 2 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {currentStop.venue.features.slice(2).map((feature) => (
                        <Badge
                          key={feature}
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {feature.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Your Notes
                  </h3>
                  {showNotes ? (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNotes(false)}
                      >
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

                <AnimatePresence mode="wait">
                  {showNotes ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Textarea
                        value={clientNotes}
                        onChange={(e) => setClientNotes(e.target.value)}
                        placeholder="What do you think about this venue? Any questions or ideas for your event?"
                        rows={4}
                        className="resize-none"
                      />
                    </motion.div>
                  ) : clientNotes ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-3 bg-muted/50 rounded-lg"
                    >
                      <p className="text-sm text-foreground/80 italic">
                        &quot;{clientNotes}&quot;
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-muted-foreground"
                    >
                      Tap &quot;Add Notes&quot; to record your thoughts about
                      this venue.
                    </motion.p>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-4">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1 gap-1"
          >
            <SkipBack className="h-4 w-4" />
            Previous
          </Button>

          {/* Step indicator dots */}
          <div className="hidden sm:flex items-center gap-1 px-2">
            {stops.slice(0, 7).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  idx === currentIndex
                    ? "bg-primary w-3"
                    : idx < currentIndex
                    ? "bg-primary/50"
                    : "bg-muted-foreground/30"
                )}
              />
            ))}
            {stops.length > 7 && (
              <span className="text-xs text-muted-foreground ml-1">
                +{stops.length - 7}
              </span>
            )}
          </div>

          <Button onClick={handleNext} className="flex-1 gap-1">
            {currentIndex === stops.length - 1 ? (
              <>
                Complete
                <Sparkles className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <SkipForward className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}
