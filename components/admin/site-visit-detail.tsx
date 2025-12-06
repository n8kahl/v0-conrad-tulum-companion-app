"use client"

import type { SiteVisit, Venue, VisitStop } from "@/lib/supabase/types"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  venues: Venue[]
  stops: (VisitStop & { venue: Venue })[]
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
    }
  }

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

      <div className="grid gap-6 lg:grid-cols-3">
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
                <div className="space-y-2">
                  {stops.map((stop, index) => (
                    <div
                      key={stop.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{stop.venue?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {stop.venue?.venue_type.replace("_", " ")}
                        </p>
                      </div>
                      {stop.client_favorited && <Badge className="bg-accent/20 text-accent text-xs">Favorited</Badge>}
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
              <Button asChild variant="outline" className="w-full bg-transparent">
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview Client View
                </a>
              </Button>
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
      </div>
    </div>
  )
}
