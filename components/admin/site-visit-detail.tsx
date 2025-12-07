"use client"

import type { SiteVisit, Venue, VisitStop, MediaLibrary, VenueMedia } from "@/lib/supabase/types"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  ArrowLeft,
  Building2,
  Users,
  Calendar,
  Mail,
  Phone,
  Copy,
  Check,
  ExternalLink,
  Plus,
  MapPin,
  X,
  Clock,
  ChevronUp,
  ChevronDown,
  Star,
  MessageSquare,
  Camera,
  Expand,
  Minimize,
  CalendarDays,
  Eye,
} from "lucide-react"

const statusColors: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  proposal_sent: "bg-primary/10 text-primary",
}

interface SiteVisitDetailProps {
  visit: SiteVisit
  venues: (Venue & { venue_media?: (VenueMedia & { media: MediaLibrary })[] })[]
  stops: (VisitStop & { venue: Venue & { venue_media?: (VenueMedia & { media: MediaLibrary })[] } })[]
}

/**
 * Helper to extract hero image URL from venue_media relations
 */
function getVenueHeroImage(venue: Venue & { venue_media?: (VenueMedia & { media: MediaLibrary })[] }): string | null {
  const toUrl = (path?: string | null) => {
    if (!path) return null
    if (path.startsWith("http://") || path.startsWith("https://")) return path
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    if (!supabaseUrl) return null
    
    // Clean path - remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    return `${supabaseUrl}/storage/v1/object/public/media-library/${cleanPath}`
  }

  if (!venue.venue_media || venue.venue_media.length === 0) return null
  
  // Find hero image first (prefer primary), then fallback to first gallery image
  const heroMedia = venue.venue_media.find((vm) => vm.context === "hero" && vm.is_primary) 
    ?? venue.venue_media.find((vm) => vm.context === "hero")
  
  if (heroMedia?.media) {
    const media = heroMedia.media
    return toUrl(media.thumbnail_path) ?? toUrl(media.storage_path)
  }
  
  // Fallback to first gallery image
  const galleryMedia = venue.venue_media.find((vm) => vm.context === "gallery" && vm.is_primary)
    ?? venue.venue_media.find((vm) => vm.context === "gallery")
  if (galleryMedia?.media) {
    return toUrl(galleryMedia.media.thumbnail_path) ?? toUrl(galleryMedia.media.storage_path)
  }
  
  return null
}

/**
 * Helper to get venue capacity for a specific setup type
 */
function getVenueCapacity(venue: Venue, setupType: string): number | null {
  if (!venue.capacities || typeof venue.capacities !== 'object') return null
  return (venue.capacities as Record<string, number>)[setupType] || null
}

export function SiteVisitDetail({ visit: initialVisit, venues, stops: initialStops }: SiteVisitDetailProps) {
  const router = useRouter()
  const [visit, setVisit] = useState(initialVisit)
  const [stops, setStops] = useState(initialStops)
  const [copied, setCopied] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState<string>("")
  const [venueSearch, setVenueSearch] = useState("")
  const [savingStops, setSavingStops] = useState<Set<string>>(new Set())
  const [showVenueGrid, setShowVenueGrid] = useState(false)

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/visit/${visit.share_token}`

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const updateStatus = async (newStatus: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("site_visits")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", visit.id)

    if (!error) {
      setVisit({ ...visit, status: newStatus as SiteVisit["status"] })
    }
  }

  const addStop = async () => {
    if (!selectedVenue) return
    const supabase = createClient()

    const { data, error } = await supabase
      .from("visit_stops")
      .insert({
        site_visit_id: visit.id,
        venue_id: selectedVenue,
        order_index: stops.length,
      })
      .select("*, venue:venues(*, venue_media(*, media:media_library(*)))")
      .single()

    if (!error && data) {
      setStops([...stops, data])
      setSelectedVenue("")
      toast.success(`${data.venue?.name} added to tour`)
    } else {
      toast.error("Failed to add venue")
    }
  }

  const removeStop = async (stopId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("visit_stops").delete().eq("id", stopId)

    if (!error) {
      const newStops = stops.filter((s) => s.id !== stopId)
      // Reindex remaining stops
      await Promise.all(
        newStops.map((stop, index) =>
          supabase.from("visit_stops").update({ order_index: index }).eq("id", stop.id)
        )
      )
      setStops(newStops.map((s, i) => ({ ...s, order_index: i })))
      toast.success("Stop removed from tour")
    }
  }

  const moveStop = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= stops.length) return

    const supabase = createClient()
    const newStops = [...stops]
    ;[newStops[index], newStops[newIndex]] = [newStops[newIndex], newStops[index]]

    // Update order_index for swapped stops
    await Promise.all([
      supabase.from("visit_stops").update({ order_index: newIndex }).eq("id", stops[index].id),
      supabase.from("visit_stops").update({ order_index: index }).eq("id", stops[newIndex].id),
    ])

    setStops(newStops.map((s, i) => ({ ...s, order_index: i })))
  }

  const updateStopTime = async (stopId: string, time: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("visit_stops")
      .update({ scheduled_time: time || null })
      .eq("id", stopId)

    if (!error) {
      setStops(stops.map((s) => (s.id === stopId ? { ...s, scheduled_time: time || null } : s)))
      toast.success("Time updated")
    }
  }

  const updateStopNotes = async (stopId: string, notes: string) => {
    // Add to saving set
    setSavingStops(prev => new Set(prev).add(stopId))
    
    const supabase = createClient()
    const { error } = await supabase
      .from("visit_stops")
      .update({ sales_notes: notes || null })
      .eq("id", stopId)

    // Remove from saving set after save completes
    setTimeout(() => {
      setSavingStops(prev => {
        const next = new Set(prev)
        next.delete(stopId)
        return next
      })
    }, 500)

    if (!error) {
      setStops(stops.map((s) => (s.id === stopId ? { ...s, sales_notes: notes || null } : s)))
    }
  }

  const toggleFavorite = async (stopId: string, currentValue: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("visit_stops")
      .update({ client_favorited: !currentValue })
      .eq("id", stopId)

    if (!error) {
      setStops(stops.map((s) => (s.id === stopId ? { ...s, client_favorited: !currentValue } : s)))
    }
  }

  const updateClientReaction = async (stopId: string, reaction: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("visit_stops")
      .update({ client_reaction: reaction || null })
      .eq("id", stopId)

    if (!error) {
      setStops(stops.map((s) => (s.id === stopId ? { ...s, client_reaction: reaction || null } : s)))
    }
  }

  const addPhoto = async (stopId: string, photoUrl: string) => {
    if (!photoUrl.trim()) return
    const stop = stops.find((s) => s.id === stopId)
    if (!stop) return

    const newPhotos = [...(stop.photos || []), photoUrl.trim()]
    const supabase = createClient()
    const { error } = await supabase
      .from("visit_stops")
      .update({ photos: newPhotos })
      .eq("id", stopId)

    if (!error) {
      setStops(stops.map((s) => (s.id === stopId ? { ...s, photos: newPhotos } : s)))
      toast.success("Photo added")
    }
  }

  const removePhoto = async (stopId: string, photoIndex: number) => {
    const stop = stops.find((s) => s.id === stopId)
    if (!stop) return

    const newPhotos = (stop.photos || []).filter((_, i) => i !== photoIndex)
    const supabase = createClient()
    const { error } = await supabase
      .from("visit_stops")
      .update({ photos: newPhotos })
      .eq("id", stopId)

    if (!error) {
      setStops(stops.map((s) => (s.id === stopId ? { ...s, photos: newPhotos } : s)))
    }
  }

  const [expandedStop, setExpandedStop] = useState<string | null>(null)
  const [newPhotoUrl, setNewPhotoUrl] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/visits">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-light text-foreground">{visit.client_company}</h1>
              <Badge className={`text-xs ${statusColors[visit.status] || statusColors.planning}`}>
                {visit.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="capitalize flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {visit.group_type} event
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : "Date TBD"}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {visit.estimated_attendees || "Attendees TBD"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
          >
            <a href={shareUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Client view
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
          >
            <Link href={`/admin/visits/${visit.id}/agenda`}>
              <CalendarDays className="h-4 w-4" />
              Agenda
            </Link>
          </Button>
          <Button
            variant={showPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? "Hide" : "Show"} preview
          </Button>
          <Select value={visit.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Client Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Visit overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Client contact</p>
                  <p className="font-medium">{visit.client_contact?.name || "—"}</p>
                  {visit.client_contact?.title && (
                    <p className="text-xs text-muted-foreground">{visit.client_contact.title}</p>
                  )}
                </div>
                <div className="space-y-2">
                  {visit.client_contact?.email && (
                    <a
                      href={`mailto:${visit.client_contact.email}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="h-4 w-4" />
                      {visit.client_contact.email}
                    </a>
                  )}
                  {visit.client_contact?.phone && (
                    <a
                      href={`tel:${visit.client_contact.phone}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Phone className="h-4 w-4" />
                      {visit.client_contact.phone}
                    </a>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Group type</p>
                  <p className="font-medium capitalize">{visit.group_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendees</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {visit.estimated_attendees || "TBD"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Visit date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : "TBD"}
                  </p>
                </div>
              </div>
              {visit.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-1">Internal notes</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{visit.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tour Plan */}
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Tour Plan
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {stops.length} {stops.length === 1 ? 'venue' : 'venues'} • Drag to reorder
                </p>
              </div>
              <Button 
                onClick={() => setShowVenueGrid(!showVenueGrid)} 
                className="bg-primary hover:bg-primary/90"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Venues
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Visual Venue Selector Grid */}
              {showVenueGrid && (
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border-2 border-dashed border-primary/20">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search venues..."
                      value={venueSearch}
                      onChange={(e) => setVenueSearch(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowVenueGrid(false)}
                    >
                      Done
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                    {venues
                      .filter((v) => 
                        v.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
                        v.venue_type.toLowerCase().includes(venueSearch.toLowerCase())
                      )
                      .map((venue) => {
                        const alreadyAdded = stops.some((s) => s.venue_id === venue.id)
                        const heroImage = getVenueHeroImage(venue)
                        const capacity = getVenueCapacity(venue, 'banquet') || getVenueCapacity(venue, 'reception') || getVenueCapacity(venue, 'theater')
                        
                        return (
                          <button
                            key={venue.id}
                            onClick={() => {
                              if (!alreadyAdded) {
                                setSelectedVenue(venue.id)
                                addStop()
                              }
                            }}
                            disabled={alreadyAdded}
                            className={`relative group text-left rounded-lg border-2 overflow-hidden transition-all ${
                              alreadyAdded 
                                ? 'opacity-50 cursor-not-allowed border-muted bg-muted/50' 
                                : 'hover:border-primary hover:shadow-md cursor-pointer border-border bg-card'
                            }`}
                          >
                            <div className="aspect-[4/3] relative bg-muted">
                              {heroImage ? (
                                <Image
                                  src={heroImage}
                                  alt={venue.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <MapPin className="h-8 w-8 text-muted-foreground/30" />
                                </div>
                              )}
                              {alreadyAdded && (
                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                  <Check className="h-8 w-8 text-primary" />
                                </div>
                              )}
                            </div>
                            <div className="p-2">
                              <p className="font-medium text-sm truncate">{venue.name}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-muted-foreground capitalize truncate">
                                  {venue.venue_type.replace('_', ' ')}
                                </p>
                                {capacity && (
                                  <Badge variant="secondary" className="text-xs h-5">
                                    <Users className="h-3 w-3 mr-1" />
                                    {capacity}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Tour Stops - Redesigned */}
              {stops.length > 0 ? (
                <div className="space-y-3">
                  {stops.map((stop, index) => {
                    const heroImage = stop.venue ? getVenueHeroImage(stop.venue) : null
                    const isSaving = savingStops.has(stop.id)

                    return (
                      <div
                        key={stop.id}
                        className="group rounded-lg border-2 bg-card hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
                      >
                        {/* Header: Image + Venue Info + Actions */}
                        <div className="flex gap-4 p-4">
                          {/* Reorder Handle */}
                          <div className="flex flex-col items-center gap-0.5 pt-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                              {index + 1}
                            </div>
                            <div className="flex flex-col mt-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => moveStop(index, "up")}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => moveStop(index, "down")}
                                disabled={index === stops.length - 1}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Venue Image - Larger for better visibility */}
                          <div className="relative w-32 h-24 rounded-lg overflow-hidden bg-muted shrink-0 border">
                            {heroImage ? (
                              <Image
                                src={heroImage}
                                alt={stop.venue?.name || 'Venue'}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50">
                                <MapPin className="h-6 w-6" />
                                <p className="text-xs mt-1">No image</p>
                              </div>
                            )}
                          </div>

                          {/* Venue Details */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-lg truncate">{stop.venue?.name}</h3>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {stop.venue?.venue_type.replace("_", " ")}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-8 w-8 ${stop.client_favorited ? "text-yellow-500" : "text-muted-foreground"}`}
                                  onClick={() => toggleFavorite(stop.id, stop.client_favorited || false)}
                                  title="Mark as favorite"
                                >
                                  <Star className={`h-4 w-4 ${stop.client_favorited ? "fill-current" : ""}`} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeStop(stop.id)}
                                  title="Remove from tour"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Capacity Badges - More Prominent */}
                            {stop.venue && (stop.venue.capacities as Record<string, number> | null) && (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(stop.venue.capacities as Record<string, number>)
                                  .slice(0, 4)
                                  .map(([setup, capacity]) => (
                                    <Badge key={setup} variant="secondary" className="text-xs px-2 py-1 font-medium">
                                      <Users className="h-3 w-3 mr-1" />
                                      {setup.charAt(0).toUpperCase() + setup.slice(1)}: {capacity}
                                    </Badge>
                                  ))}
                              </div>
                            )}

                            {/* Time Selection */}
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <Input
                                type="time"
                                className="w-36 h-9"
                                value={stop.scheduled_time || ""}
                                onChange={(e) => updateStopTime(stop.id, e.target.value)}
                                placeholder="Set time"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Planning Notes - Always Visible */}
                        <div className="px-4 pb-4 space-y-3 border-t pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                Pre-Tour Notes
                                <span className="text-xs text-muted-foreground font-normal">
                                  (What to highlight during the tour)
                                </span>
                              </label>
                              {isSaving && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                                  Saving...
                                </span>
                              )}
                            </div>
                            <Textarea
                              placeholder={`e.g., "Highlight the natural lighting and ocean views. Mention the built-in AV system and flexible seating arrangements for up to ${getVenueCapacity(stop.venue!, 'reception') || '150'} guests."`}
                              className="min-h-[100px] text-sm resize-none focus:ring-2 focus:ring-primary/20"
                              value={stop.sales_notes || ""}
                              onChange={(e) => {
                                const newStops = stops.map(s => 
                                  s.id === stop.id ? { ...s, sales_notes: e.target.value } : s
                                )
                                setStops(newStops)
                              }}
                              onBlur={(e) => updateStopNotes(stop.id, e.target.value)}
                            />
                          </div>

                          {/* Post-Tour Section - Collapsed by default */}
                          {(stop.client_reaction || (stop.photos && stop.photos.length > 0)) && (
                            <details className="group/details">
                              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 py-2">
                                <Camera className="h-4 w-4" />
                                Post-Tour Captures
                                <Badge variant="outline" className="ml-auto">
                                  {(stop.photos?.length || 0) + (stop.client_reaction ? 1 : 0)} items
                                </Badge>
                              </summary>
                              <div className="space-y-3 pt-2">
                                {stop.client_reaction && (
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Client Feedback</label>
                                    <div className="p-3 bg-muted/50 rounded-md text-sm">
                                      {stop.client_reaction}
                                    </div>
                                  </div>
                                )}
                                {stop.photos && stop.photos.length > 0 && (
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Photos</label>
                                    <div className="flex flex-wrap gap-2">
                                      {stop.photos.map((photo, photoIndex) => (
                                        <div
                                          key={photoIndex}
                                          className="relative group/photo rounded overflow-hidden border"
                                        >
                                          <img
                                            src={photo}
                                            alt={`Stop photo ${photoIndex + 1}`}
                                            className="w-24 h-24 object-cover"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => removePhoto(stop.id, photoIndex)}
                                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Build Your Tour</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Click "Add Venues" above to start building your site visit tour. Add venues, set times, and write notes about what to highlight.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Set times
                    </div>
                    <div className="text-muted-foreground">•</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      Add notes
                    </div>
                    <div className="text-muted-foreground">•</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3" />
                      Mark favorites
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Client access & agenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg truncate">{visit.share_token}</code>
                <Button variant="outline" size="icon" onClick={copyShareLink}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Client view
                  </a>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/admin/visits/${visit.id}/agenda`}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Agenda
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {showPreview && (
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Client preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
                <div>
                  <h2 className="text-base font-medium">{visit.client_company}</h2>
                  <p className="text-xs text-muted-foreground capitalize">
                    {visit.group_type} Event
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {visit.visit_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(visit.visit_date).toLocaleDateString()}
                      </span>
                    )}
                    {visit.estimated_attendees && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {visit.estimated_attendees} guests
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Tour stops</p>
                  {stops.length > 0 ? (
                    <div className="space-y-2">
                      {stops.map((stop, idx) => (
                        <div key={stop.id} className="flex items-start gap-3 rounded-md border p-2 bg-card/80">
                          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{stop.venue?.name}</p>
                            <p className="text-[11px] text-muted-foreground capitalize">
                              {stop.venue?.venue_type.replace("_", " ")}
                            </p>
                            {stop.scheduled_time && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {stop.scheduled_time}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground py-4 text-center">No venues in tour yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
