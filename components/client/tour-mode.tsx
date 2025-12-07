"use client"

import type { VisitStop, Venue, SiteVisit, VisitCapture, VenueMedia } from "@/lib/supabase/types"
import { useState, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ReactionPicker } from "./reaction-picker"
import { CaptureToolbar, type CaptureResult } from "./capture-toolbar"
import { CameraCapture } from "./camera-capture"
import { VoiceRecorder, type VoiceRecordingResult } from "./voice-recorder"
import { CapturePreview, CaptureFullPreview } from "./capture-preview"
import { VenueMediaViewer } from "./venue-media-viewer"
import { VenueMediaManager } from "./venue-media-manager"
import { VenueResourcesDrawer } from "./venue-resources-drawer"
import { useGeolocation } from "@/lib/hooks/use-geolocation"
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
  Camera,
  FileText,
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
  const [reactions, setReactions] = useState<string[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)

  // Capture state
  const [showCamera, setShowCamera] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [captures, setCaptures] = useState<VisitCapture[]>([])
  const [previewCapture, setPreviewCapture] = useState<VisitCapture | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showMediaViewer, setShowMediaViewer] = useState(false)
  const [showResourcesDrawer, setShowResourcesDrawer] = useState(false)
  const [showMediaManager, setShowMediaManager] = useState(false)
  const [mediaRefreshKey, setMediaRefreshKey] = useState(0)
  const [liveVenueMedia, setLiveVenueMedia] = useState<VenueMedia[]>([])

  const supabase = createClient()
  const { getPosition } = useGeolocation()

  const currentStop = stops[currentIndex]
  const progress = ((currentIndex + 1) / stops.length) * 100
  const VenueIcon = currentStop
    ? venueTypeIcons[currentStop.venue.venue_type] || MapPin
    : MapPin
  const propertyId = currentStop?.venue.property_id || visit?.property_id || ""

  // Calculate capture statistics for current stop
  const stopCaptures = useMemo(() => {
    if (!currentStop) return { photos: 0, notes: 0, reactions: 0, isFavorited: false }
    
    const stopCaps = captures.filter(c => c.visit_stop_id === currentStop.id)
    const isEmojiReaction = (caption: string) =>
      /[\u{1F300}-\u{1F9FF}]/u.test(caption) && caption.trim().length <= 4

    const noteCount = stopCaps.filter(
      c => c.capture_type === "voice_note" || (c.caption && !isEmojiReaction(c.caption))
    ).length
    const reactionCount = stopCaps.filter(
      c => c.caption && isEmojiReaction(c.caption)
    ).length
    const textNotes = clientNotes.trim() ? 1 : 0
    return {
      photos: stopCaps.filter(c => c.capture_type === "photo").length,
      notes: noteCount + textNotes,
      reactions: reactionCount,
      isFavorited: currentStop.client_favorited || false,
    }
  }, [currentStop, captures, clientNotes])

  // Get venue media resources grouped by context
  const venueMediaResources = useMemo(() => {
    if (liveVenueMedia.length > 0) return liveVenueMedia
    if (!currentStop?.venue) return []
    const venue = currentStop.venue as any
    return venue.venue_media || []
  }, [currentStop, liveVenueMedia])

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

  // Load captures for current stop
  useEffect(() => {
    if (!currentStop) return

    const loadCaptures = async () => {
      try {
        const response = await fetch(`/api/captures?visitStopId=${currentStop.id}`)
        if (response.ok) {
          const data = await response.json()
          setCaptures(data)
        }
      } catch (error) {
        console.error("Failed to load captures:", error)
      }
    }

    loadCaptures()
  }, [currentStop])

  // Load venue media for manager/viewer
  useEffect(() => {
    if (!currentStop) return

    const loadVenueMedia = async () => {
      const { data, error } = await supabase
        .from("venue_media")
        .select("*, media:media_library(*)")
        .eq("venue_id", currentStop.venue.id)
        .order("context")
        .order("display_order")

      if (!error && data) {
        setLiveVenueMedia(data as VenueMedia[])
      }
    }

    loadVenueMedia()
  }, [currentStop, mediaRefreshKey])

  // Handle capture toolbar actions
  const handleCaptureStart = useCallback((type: CaptureResult["type"]) => {
    if (type === "photo") {
      setShowCamera(true)
    } else if (type === "voice_note") {
      setShowVoiceRecorder(true)
    }
  }, [])

  // Handle photo capture
  const handlePhotoCapture = useCallback(async (
    file: File,
    metadata: { capturedAt: Date; location?: { lat: number; lng: number }; venueId: string; venueName: string }
  ) => {
    if (!currentStop) return

    setIsUploading(true)
    try {
      // Upload to Supabase Storage
      const fileName = `tour-captures/${currentStop.id}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("media-library")
        .upload(fileName, file)

      if (uploadError) {
        throw new Error("Failed to upload photo")
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("media-library")
        .getPublicUrl(fileName)

      // Create capture record
      const response = await fetch("/api/captures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitStopId: currentStop.id,
          captureType: "photo",
          storagePath: urlData.publicUrl,
          location: metadata.location,
          capturedBy: "sales",
          propertyId: visit?.property_id,
          fileName: file.name,
          fileType: "image",
          mimeType: file.type,
          fileSize: file.size,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save capture")
      }

      const captureData = await response.json()

      // Add to local state
      const newCapture: VisitCapture = {
        id: captureData.id,
        visit_stop_id: currentStop.id,
        media_id: captureData.mediaId,
        capture_type: "photo",
        caption: null,
        transcript: null,
        sentiment: null,
        captured_at: new Date().toISOString(),
        captured_by: "sales",
        location: metadata.location || null,
        created_at: new Date().toISOString(),
        media: {
          id: captureData.mediaId,
          property_id: visit?.property_id || "",
          file_name: file.name,
          file_type: "image",
          mime_type: file.type,
          storage_path: urlData.publicUrl,
          thumbnail_path: null,
          file_size: file.size,
          dimensions: {},
          duration: null,
          metadata: {},
          tags: ["photo", "tour-capture"],
          uploaded_by: null,
          source: "capture",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }

      setCaptures(prev => [...prev, newCapture])
      toast.success("Photo captured!")
      setShowCamera(false)
    } catch (error) {
      console.error("Photo capture error:", error)
      toast.error("Failed to capture photo")
    } finally {
      setIsUploading(false)
    }
  }, [currentStop, supabase, visit])

  // Handle voice recording complete
  const handleVoiceRecordingComplete = useCallback(async (result: VoiceRecordingResult) => {
    if (!currentStop) return

    setIsUploading(true)
    try {
      // Upload audio to storage
      const fileName = `tour-captures/${currentStop.id}/${Date.now()}-voice-note.webm`
      const { error: uploadError } = await supabase.storage
        .from("media-library")
        .upload(fileName, result.audioBlob)

      if (uploadError) {
        throw new Error("Failed to upload voice note")
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("media-library")
        .getPublicUrl(fileName)

      // Get transcription
      let transcript: string | undefined
      let sentiment: "positive" | "neutral" | "negative" | undefined

      try {
        const formData = new FormData()
        formData.append("audio", result.audioBlob, "voice-note.webm")

        const transcribeResponse = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        })

        if (transcribeResponse.ok) {
          const transcribeData = await transcribeResponse.json()
          transcript = transcribeData.transcript
          sentiment = transcribeData.sentiment
        }
      } catch {
        console.log("Transcription not available")
      }

      // Create capture record
      const response = await fetch("/api/captures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitStopId: currentStop.id,
          captureType: "voice_note",
          storagePath: urlData.publicUrl,
          transcript,
          sentiment,
          capturedBy: "sales",
          propertyId: visit?.property_id,
          fileName: "voice-note.webm",
          fileType: "audio",
          mimeType: "audio/webm",
          fileSize: result.audioBlob.size,
          duration: Math.round(result.duration),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save voice note")
      }

      const captureData = await response.json()

      // Add to local state
      const newCapture: VisitCapture = {
        id: captureData.id,
        visit_stop_id: currentStop.id,
        media_id: captureData.mediaId,
        capture_type: "voice_note",
        caption: null,
        transcript: transcript || null,
        sentiment: sentiment || null,
        captured_at: new Date().toISOString(),
        captured_by: "sales",
        location: null,
        created_at: new Date().toISOString(),
        media: {
          id: captureData.mediaId,
          property_id: visit?.property_id || "",
          file_name: "voice-note.webm",
          file_type: "audio",
          mime_type: "audio/webm",
          storage_path: urlData.publicUrl,
          thumbnail_path: null,
          file_size: result.audioBlob.size,
          dimensions: {},
          duration: Math.round(result.duration),
          metadata: {},
          tags: ["voice_note", "tour-capture"],
          uploaded_by: null,
          source: "capture",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }

      setCaptures(prev => [...prev, newCapture])
      toast.success("Voice note saved!")
      setShowVoiceRecorder(false)
    } catch (error) {
      console.error("Voice capture error:", error)
      toast.error("Failed to save voice note")
    } finally {
      setIsUploading(false)
    }
  }, [currentStop, supabase, visit])

  // Handle capture removal
  const handleRemoveCapture = useCallback(async (captureId: string) => {
    try {
      const response = await fetch(`/api/captures/${captureId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCaptures(prev => prev.filter(c => c.id !== captureId))
        toast.success("Capture removed")
      } else {
        throw new Error("Failed to delete capture")
      }
    } catch (error) {
      console.error("Delete capture error:", error)
      toast.error("Failed to remove capture")
    }
  }, [])

  // Handle quick reaction - Save to visit_captures for recap data flow
  const handleQuickReaction = useCallback(async (emoji: string) => {
    if (!currentStop) return

    try {
      const response = await fetch("/api/captures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitStopId: currentStop.id,
          captureType: "reaction",
          caption: emoji,
          capturedBy: "sales",
          propertyId: visit?.property_id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save reaction")
      }

      const captureData = await response.json()
      const newCapture: VisitCapture = {
        id: captureData.id,
        visit_stop_id: currentStop.id,
        media_id: captureData.mediaId || "",
        capture_type: "photo", // Reactions are saved as annotations, not captures
        caption: emoji,
        transcript: null,
        sentiment: null,
        captured_at: new Date().toISOString(),
        captured_by: "sales",
        location: null,
        created_at: new Date().toISOString(),
      }

      setCaptures(prev => [...prev, newCapture])
      toast.success(`Reaction added: ${emoji}`)
      setReactions(prev => [...prev, emoji])
    } catch (error) {
      console.error("Save reaction error:", error)
      // Still show locally even if save fails
      toast.success(`Reaction added: ${emoji}`)
      setReactions(prev => [...prev, emoji])
    }
  }, [currentStop, visit])

  // Handle quick note
  const handleQuickNote = useCallback(async (content: string) => {
    if (!currentStop) return

    // Append to client notes
    const updatedNotes = clientNotes
      ? `${clientNotes}\n• ${content}`
      : `• ${content}`

    const { error } = await supabase
      .from("visit_stops")
      .update({ client_reaction: updatedNotes })
      .eq("id", currentStop.id)

    if (!error) {
      setClientNotes(updatedNotes)
      onStopUpdate(currentStop.id, { client_reaction: updatedNotes })
      toast.success("Note added!")
    }
  }, [currentStop, clientNotes, supabase, onStopUpdate])

  // Get location helper for camera capture
  const getLocationForCapture = useCallback(async () => {
    const position = await getPosition()
    return position ? { lat: position.lat, lng: position.lng } : null
  }, [getPosition])

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
      // Tour complete - close tour mode
      setIsPlaying(false)
      toast.success("Tour complete!")
      onClose()
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMediaViewer(true)}
                className="gap-1.5 shrink-0"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Resources</span>
              </Button>
              {propertyId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMediaManager(true)}
                  className="gap-1.5 shrink-0"
                >
                  <Camera className="h-4 w-4" />
                  <span className="hidden sm:inline">Add media</span>
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
              {(() => {
                // Try to find hero image from new media system
                const heroMedia = (currentStop.venue as any).venue_media?.find(
                  (vm: any) => vm.context === "hero"
                )?.media
                
                const imageUrl = heroMedia?.storage_path
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${heroMedia.storage_path}`
                  : currentStop.venue.images?.[0]

                return imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={currentStop.venue.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <VenueIcon className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )
              })()}

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

            {/* Resources Button (if venue has media) */}
            {venueMediaResources.length > 0 && (
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResourcesDrawer(true)}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Venue Resources ({venueMediaResources.length})
                </Button>
              </div>
            )}

            {/* Captures Hub */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Camera className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Captures</p>
                      <p className="text-xs text-muted-foreground">
                        Photos, voice notes, and quick reactions for this stop.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      {stopCaptures.photos}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {stopCaptures.notes}
                    </span>
                    {stopCaptures.isFavorited && (
                      <span className="flex items-center gap-1 text-primary">
                        <Heart className="h-3 w-3 fill-current" />
                        Favorite
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={captures.length === 0}
                      onClick={() => captures[0] && setPreviewCapture(captures[0])}
                    >
                      View all
                    </Button>
                  </div>
                </div>
                {captures.length > 0 ? (
                  <CapturePreview
                    captures={captures}
                    onRemove={handleRemoveCapture}
                    onPreview={(capture) => setPreviewCapture(capture)}
                    className="bg-muted/50 rounded-xl p-2"
                  />
                ) : (
                  <div className="border border-dashed rounded-lg px-4 py-6 text-center text-sm text-muted-foreground">
                    No captures yet — use the toolbar below to add a photo, voice note, reaction, or quick note.
                  </div>
                )}
              </CardContent>
            </Card>

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
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Notes for this stop
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Keep quick thoughts and follow-ups together.
                  </p>
                </div>
                <Textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="What stands out? What would you change? Any questions to follow up on?"
                  rows={4}
                  className="resize-none"
                  maxLength={800}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Use the toolbar note button for quick bullets; refine them here.</span>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={!clientNotes.trim() && !currentStop.client_reaction}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation & Capture Toolbar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border pb-safe">
        {/* Capture Toolbar */}
        <div className="flex justify-center py-3 border-b border-border/50">
          <CaptureToolbar
            visitStopId={currentStop.id}
            venueId={currentStop.venue.id}
            venueName={currentStop.venue.name}
            onCaptureStart={handleCaptureStart}
            onReaction={handleQuickReaction}
            onNote={handleQuickNote}
            disabled={isUploading}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto p-4">
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

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handlePhotoCapture}
        venueId={currentStop.venue.id}
        venueName={currentStop.venue.name}
        getLocation={getLocationForCapture}
      />

      {/* Voice Recorder Modal */}
      <VoiceRecorder
        isOpen={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onRecordingComplete={handleVoiceRecordingComplete}
        venueId={currentStop.venue.id}
        venueName={currentStop.venue.name}
      />

      {/* Capture Full Preview */}
      {previewCapture && (
        <CaptureFullPreview
          captures={captures}
          initialIndex={captures.findIndex(c => c.id === previewCapture.id)}
          isOpen={true}
          onClose={() => setPreviewCapture(null)}
          onRemove={handleRemoveCapture}
        />
      )}

      {/* Venue Media Viewer */}
      <VenueMediaViewer
        venueId={currentStop.venue.id}
        venueName={currentStop.venue.name}
        isOpen={showMediaViewer}
        onClose={() => setShowMediaViewer(false)}
        onManage={() => setShowMediaManager(true)}
        refreshKey={mediaRefreshKey}
      />

      {/* Venue Resources Drawer */}
      <VenueResourcesDrawer
        venueName={currentStop.venue.name}
        venueMedia={venueMediaResources}
        isOpen={showResourcesDrawer}
        onClose={() => setShowResourcesDrawer(false)}
      />

      {/* Venue Media Manager */}
      {propertyId && (
        <VenueMediaManager
          venueId={currentStop.venue.id}
          propertyId={propertyId}
          venueName={currentStop.venue.name}
          isOpen={showMediaManager}
          onClose={() => setShowMediaManager(false)}
          onUpdated={() => setMediaRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  )
}
