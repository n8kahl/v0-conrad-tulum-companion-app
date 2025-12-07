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
  GripVertical,
  X,
  Clock,
  ChevronUp,
  ChevronDown,
  Star,
  MessageSquare,
  Camera,
  Image as ImageIcon,
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
    return path.startsWith("http://") || path.startsWith("https://")
      ? path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${path}`
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
  const galleryMedia = venue.venue_media.find((vm) => vm.context === "gallery")
  if (galleryMedia?.media?.storage_path) return toUrl(galleryMedia.media.storage_path)
  
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
      .select("*, venue:venues(*)")
      .single()

    if (!error && data) {
      setStops([...stops, data])
      setSelectedVenue("")
      toast.success("Stop added to tour")
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
    const supabase = createClient()
    const { error } = await supabase
      .from("visit_stops")
      .update({ sales_notes: notes || null })
      .eq("id", stopId)

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/visits">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-light text-foreground">{visit.client_company}</h1>
              <Badge className={`text-xs ${statusColors[visit.status] || statusColors.planning}`}>
                {visit.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1 capitalize">{visit.group_type} Event</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? "Hide" : "Show"} Preview
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

      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Client Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium">{visit.client_contact?.name || "—"}</p>
                  {visit.client_contact?.title && (
                    <p className="text-sm text-muted-foreground">{visit.client_contact.title}</p>
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
                  <p className="text-sm text-muted-foreground">Group Type</p>
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
                  <p className="text-sm text-muted-foreground">Visit Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : "TBD"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tour Route */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Tour Route
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Venue */}
              <div className="flex gap-2">
                <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a venue to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addStop} disabled={!selectedVenue} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Stops List */}
              {stops.length > 0 ? (
                <div className="space-y-3">
                  {stops.map((stop, index) => (
                    <div
                      key={stop.id}
                      className="p-4 rounded-lg border border-border bg-muted/30 space-y-3"
                    >
                      {/* Header row with thumbnail */}
                      <div className="flex items-start gap-3">
                        {/* Reorder buttons */}
                        <div className="flex flex-col gap-1 pt-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveStop(index, "up")}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveStop(index, "down")}
                            disabled={index === stops.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Stop number badge */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0 mt-1">
                          {index + 1}
                        </div>

                        {/* Venue thumbnail */}
                        {stop.venue && (
                          <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                            {getVenueHeroImage(stop.venue) ? (
                              <Image
                                src={getVenueHeroImage(stop.venue)!}
                                alt={stop.venue.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <MapPin className="h-6 w-6 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Venue info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{stop.venue?.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {stop.venue?.venue_type.replace("_", " ")}
                          </p>
                          {/* Capacity chips */}
                          {stop.venue && (stop.venue.capacities as Record<string, number> | null) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(stop.venue.capacities as Record<string, number>).slice(0, 3).map(([setup, capacity]) => (
                                <Badge key={setup} variant="outline" className="text-xs h-5">
                                  {setup}: {capacity}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 pt-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${stop.client_favorited ? "text-yellow-500" : "text-muted-foreground"}`}
                            onClick={() => toggleFavorite(stop.id, stop.client_favorited || false)}
                          >
                            <Star className={`h-4 w-4 ${stop.client_favorited ? "fill-current" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeStop(stop.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="flex items-start gap-4 pl-28">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            className="w-32 h-8"
                            value={stop.scheduled_time || ""}
                            onChange={(e) => updateStopTime(stop.id, e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedStop(expandedStop === stop.id ? null : stop.id)}
                          className="gap-1"
                        >
                          {expandedStop === stop.id ? (
                            <Minimize className="h-4 w-4" />
                          ) : (
                            <Expand className="h-4 w-4" />
                          )}
                          {expandedStop === stop.id ? "Less" : "More"}
                        </Button>
                      </div>

                      {/* Expanded details */}
                      {expandedStop === stop.id && (
                        <div className="pl-28 space-y-4 pt-2 border-t border-border/50">
                          {/* Sales Notes */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Sales Notes</label>
                            <Textarea
                              placeholder="Notes about this space for the proposal..."
                              className="min-h-[80px] text-sm"
                              value={stop.sales_notes || ""}
                              onChange={(e) => updateStopNotes(stop.id, e.target.value)}
                              onBlur={(e) => updateStopNotes(stop.id, e.target.value)}
                            />
                          </div>

                          {/* Client Reaction */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Client Reaction / Feedback
                            </label>
                            <Textarea
                              placeholder="Client's comments, reactions, questions..."
                              className="min-h-[60px] text-sm"
                              value={stop.client_reaction || ""}
                              onChange={(e) => updateClientReaction(stop.id, e.target.value)}
                              onBlur={(e) => updateClientReaction(stop.id, e.target.value)}
                            />
                          </div>

                          {/* Captured Media */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Camera className="h-3 w-3" />
                              Captured Media
                            </label>
                            {stop.photos && stop.photos.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {stop.photos.map((photo, photoIndex) => (
                                  <div
                                    key={photoIndex}
                                    className="relative group rounded overflow-hidden border"
                                  >
                                    <img
                                      src={photo}
                                      alt={`Stop photo ${photoIndex + 1}`}
                                      className="w-20 h-20 object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removePhoto(stop.id, photoIndex)}
                                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 py-3 px-4 rounded-md bg-muted/50 border border-dashed">
                                <Camera className="h-4 w-4 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  Media captured during tour will appear here
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No venues added to the tour yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Share Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Client Access Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share this link with your client to give them access to their site visit portal.
              </p>
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg truncate">{visit.share_token}</code>
                <Button variant="outline" size="icon" onClick={copyShareLink} className="bg-transparent">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1 bg-transparent">
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Client View
                  </a>
                </Button>
                <Button asChild variant="outline" className="flex-1 bg-transparent">
                  <Link href={`/admin/visits/${visit.id}/agenda`}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Agenda
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {visit.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{visit.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-6">
              <CardHeader className="border-b">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Client View Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Preview header */}
                <div className="space-y-2">
                  <h2 className="text-xl font-light">{visit.client_company}</h2>
                  <p className="text-sm text-muted-foreground capitalize">
                    {visit.group_type} Event
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {visit.visit_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(visit.visit_date).toLocaleDateString()}
                      </div>
                    )}
                    {visit.estimated_attendees && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {visit.estimated_attendees} guests
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">Your Tour</h3>
                  {stops.length > 0 ? (
                    <div className="space-y-3">
                      {stops.map((stop, index) => (
                        <div
                          key={stop.id}
                          className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            {/* Stop number */}
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                              {index + 1}
                            </div>

                            {/* Venue thumbnail (smaller in preview) */}
                            {stop.venue && (
                              <div className="relative w-12 h-12 rounded overflow-hidden bg-muted shrink-0">
                                {getVenueHeroImage(stop.venue) ? (
                                  <Image
                                    src={getVenueHeroImage(stop.venue)!}
                                    alt={stop.venue.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <MapPin className="h-5 w-5 text-muted-foreground/30" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Venue info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {stop.venue?.name}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {stop.venue?.venue_type.replace("_", " ")}
                              </p>
                              {stop.scheduled_time && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {stop.scheduled_time}
                                </p>
                              )}
                              {stop.client_favorited && (
                                <Badge variant="outline" className="mt-1 text-xs h-5 gap-1">
                                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                                  Favorited
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No venues in tour yet
                    </p>
                  )}
                </div>

                <div className="text-xs text-muted-foreground pt-4 border-t">
                  <p className="italic">
                    This is a live preview of what your client sees.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
