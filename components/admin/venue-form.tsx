"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, Plus, Save, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { ImageUploadField } from "./image-upload-field"
import { VenueMediaManager } from "./venue-media-manager"
import type { VenueMediaLink } from "@/lib/supabase/types"

const venueTypes = [
  { value: "property", label: "🏨 Property (Root)", hierarchy: true },
  { value: "building", label: "🏢 Building", hierarchy: true },
  { value: "floor", label: "📐 Floor", hierarchy: true },
  { value: "space", label: "🗺️ Space (Generic)", hierarchy: true },
  { value: "meeting_room", label: "Meeting Room" },
  { value: "outdoor", label: "Outdoor" },
  { value: "restaurant", label: "Restaurant" },
  { value: "spa", label: "Spa" },
  { value: "pool", label: "Pool" },
  { value: "lobby", label: "Lobby" },
  { value: "ballroom", label: "Ballroom" },
  { value: "beach", label: "Beach" },
]

const capacityTypes = [
  { key: "theater", label: "Theater" },
  { key: "classroom", label: "Classroom" },
  { key: "banquet", label: "Banquet" },
  { key: "reception", label: "Reception" },
  { key: "u_shape", label: "U-Shape" },
  { key: "boardroom", label: "Boardroom" },
]

const commonFeatures = [
  "natural_light",
  "av_built_in",
  "divisible",
  "pre_function_area",
  "outdoor_access",
  "ocean_view",
  "private_entrance",
  "catering_kitchen",
  "climate_control",
  "blackout_capable",
]

interface Venue {
  id: string
  property_id: string
  name: string
  venue_type: string
  capacities: Record<string, number>
  dimensions: {
    length_m?: number
    width_m?: number
    height_m?: number
    sqm?: number
  }
  features: string[]
  images: string[]
  floorplan_url: string | null
  map_coordinates: { x?: number; y?: number }
  map_image_url: string | null
  map_image_media_id: string | null
  parent_venue_id: string | null
  location: { mapX?: number; mapY?: number; lat?: number; lng?: number; building?: string; floor?: string } | null
  description: string | null
  is_active: boolean
}

interface VenueFormProps {
  venue?: Venue
  propertyId: string
  mode: "create" | "edit"
}

export function VenueForm({ venue, propertyId, mode }: VenueFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mediaLinks, setMediaLinks] = useState<VenueMediaLink[]>([])
  const [parentVenues, setParentVenues] = useState<Array<{id: string, name: string, venue_type: string}>>([])
  const [childVenues, setChildVenues] = useState<Array<{id: string, name: string, location: any}>>([])

  // Fetch media links and related venues if editing
  useEffect(() => {
    const fetchData = async () => {
      // Fetch parent venues (for hierarchy dropdown)
      const { data: parents } = await supabase
        .from("venues")
        .select("id, name, venue_type")
        .in("venue_type", ["property", "building", "floor"])
        .order("name")
      
      if (parents) {
        setParentVenues(parents)
      }
      
      if (venue?.id) {
        // Fetch media links
        const { data: media } = await supabase
          .from("venue_media")
          .select("*")
          .eq("venue_id", venue.id)
          .order("display_order")
        
        if (media) {
          setMediaLinks(media as VenueMediaLink[])
        }
        
        // Fetch child venues (for map pin editor)
        const { data: children } = await supabase
          .from("venues")
          .select("id, name, location")
          .eq("parent_venue_id", venue.id)
          .order("name")
        
        if (children) {
          setChildVenues(children)
        }
      }
    }
    fetchData()
  }, [venue?.id, supabase])

  // Form state
  const [name, setName] = useState(venue?.name || "")
  const [venueType, setVenueType] = useState(venue?.venue_type || "meeting_room")
  const [description, setDescription] = useState(venue?.description || "")
  const [capacities, setCapacities] = useState<Record<string, number>>(
    venue?.capacities || {}
  )
  const [dimensions, setDimensions] = useState({
    length_m: venue?.dimensions?.length_m || 0,
    width_m: venue?.dimensions?.width_m || 0,
    height_m: venue?.dimensions?.height_m || 0,
    sqm: venue?.dimensions?.sqm || 0,
  })
  const [features, setFeatures] = useState<string[]>(venue?.features || [])
  const [mapCoordinates, setMapCoordinates] = useState({
    x: venue?.map_coordinates?.x || 50,
    y: venue?.map_coordinates?.y || 50,
  })
  const [mapImageUrl, setMapImageUrl] = useState(venue?.map_image_url || "")
  const [mapImageMediaId, setMapImageMediaId] = useState(venue?.map_image_media_id || "")
  const [parentVenueId, setParentVenueId] = useState(venue?.parent_venue_id || "")
  const [location, setLocation] = useState({
    mapX: venue?.location?.mapX || 50,
    mapY: venue?.location?.mapY || 50,
    lat: venue?.location?.lat || 0,
    lng: venue?.location?.lng || 0,
    building: venue?.location?.building || "",
    floor: venue?.location?.floor || "",
  })
  const [isActive, setIsActive] = useState(venue?.is_active ?? true)

  const handleCapacityChange = (key: string, value: string) => {
    const numValue = parseInt(value) || 0
    if (numValue > 0) {
      setCapacities((prev) => ({ ...prev, [key]: numValue }))
    } else {
      const newCapacities = { ...capacities }
      delete newCapacities[key]
      setCapacities(newCapacities)
    }
  }

  const toggleFeature = (feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const venueData = {
        property_id: propertyId,
        name,
        venue_type: venueType,
        description: description || null,
        capacities,
        dimensions: {
          ...dimensions,
          sqm: dimensions.sqm || dimensions.length_m * dimensions.width_m,
        },
        features,
        images: [], // Legacy field - kept for backward compatibility, new media system is source of truth
        floorplan_url: null, // Legacy field - kept for backward compatibility, new media system is source of truth
        map_coordinates: mapCoordinates,
        map_image_url: mapImageUrl || null,
        map_image_media_id: mapImageMediaId || null,
        parent_venue_id: parentVenueId || null,
        location,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      }

      let savedVenueId = venue?.id

      if (mode === "create") {
        const { data, error } = await supabase
          .from("venues")
          .insert(venueData)
          .select()
          .single()
        
        if (error) throw error
        savedVenueId = data.id
        toast.success("Venue created successfully")
      } else {
        const { error } = await supabase
          .from("venues")
          .update(venueData)
          .eq("id", venue?.id)
        
        if (error) throw error
        toast.success("Venue updated successfully")
      }

      // Save media links
      if (savedVenueId) {
        // Delete existing
        await supabase.from("venue_media").delete().eq("venue_id", savedVenueId)
        
        // Insert new
        if (mediaLinks.length > 0) {
          const linksToInsert = mediaLinks.map(link => ({
            venue_id: savedVenueId,
            media_id: link.media_id,
            context: link.context,
            display_order: link.display_order,
            is_primary: link.is_primary,
            caption: link.caption,
            show_on_tour: link.show_on_tour,
            show_on_public: link.show_on_public
          }))
          
          const { error: mediaError } = await supabase
            .from("venue_media")
            .insert(linksToInsert)
            
          if (mediaError) {
            console.error("Error saving media:", mediaError)
            toast.error("Venue saved but media update failed")
          }
        }
      }

      router.push("/admin/venues")
      router.refresh()
    } catch (error) {
      console.error("Error saving venue:", error)
      toast.error("Failed to save venue")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/venues">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-light text-foreground">
              {mode === "create" ? "Add New Venue" : `Edit ${venue?.name}`}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {mode === "create"
                ? "Create a new venue for site visits"
                : "Update venue details"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/venues">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {mode === "create" ? "Create Venue" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Venue Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Grand Ballroom"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Venue Type *</Label>
              <Select value={venueType} onValueChange={setVenueType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {venueTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the venue..."
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="is_active" className="font-normal">
                Active (visible on public pages)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Dimensions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Length (m)</Label>
                <Input
                  id="length"
                  type="number"
                  value={dimensions.length_m || ""}
                  onChange={(e) =>
                    setDimensions((prev) => ({
                      ...prev,
                      length_m: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width (m)</Label>
                <Input
                  id="width"
                  type="number"
                  value={dimensions.width_m || ""}
                  onChange={(e) =>
                    setDimensions((prev) => ({
                      ...prev,
                      width_m: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Ceiling Height (m)</Label>
                <Input
                  id="height"
                  type="number"
                  value={dimensions.height_m || ""}
                  onChange={(e) =>
                    setDimensions((prev) => ({
                      ...prev,
                      height_m: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sqm">Total Area (m²)</Label>
                <Input
                  id="sqm"
                  type="number"
                  value={dimensions.sqm || ""}
                  onChange={(e) =>
                    setDimensions((prev) => ({
                      ...prev,
                      sqm: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="Auto-calculated if empty"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Label className="mb-3 block">Map Position (%)</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Position on resort map (0-100). Center is 50,50.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="map-x">X (horizontal)</Label>
                  <Input
                    id="map-x"
                    type="number"
                    min={0}
                    max={100}
                    value={mapCoordinates.x}
                    onChange={(e) =>
                      setMapCoordinates((prev) => ({
                        ...prev,
                        x: Math.min(100, Math.max(0, parseFloat(e.target.value) || 50)),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="map-y">Y (vertical)</Label>
                  <Input
                    id="map-y"
                    type="number"
                    min={0}
                    max={100}
                    value={mapCoordinates.y}
                    onChange={(e) =>
                      setMapCoordinates((prev) => ({
                        ...prev,
                        y: Math.min(100, Math.max(0, parseFloat(e.target.value) || 50)),
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seating Capacities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {capacityTypes.map((cap) => (
                <div key={cap.key} className="space-y-2">
                  <Label htmlFor={`cap-${cap.key}`}>{cap.label}</Label>
                  <Input
                    id={`cap-${cap.key}`}
                    type="number"
                    value={capacities[cap.key] || ""}
                    onChange={(e) => handleCapacityChange(cap.key, e.target.value)}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Features & Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {commonFeatures.map((feature) => (
                <Badge
                  key={feature}
                  variant={features.includes(feature) ? "default" : "outline"}
                  className="cursor-pointer select-none capitalize"
                  onClick={() => toggleFeature(feature)}
                >
                  {feature.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Click to toggle features on/off
            </p>
          </CardContent>
        </Card>

        {/* Hierarchy & Map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Venue Hierarchy & Map</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="parent_venue">Parent Venue</Label>
                <Select
                  value={parentVenueId || "none"}
                  onValueChange={(val) => setParentVenueId(val === "none" ? "" : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (top-level venue)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level venue)</SelectItem>
                    {parentVenues.map((pv) => (
                      <SelectItem key={pv.id} value={pv.id}>
                        {pv.venue_type === "property" && "🏨 "}
                        {pv.venue_type === "building" && "🏢 "}
                        {pv.venue_type === "floor" && "📐 "}
                        {pv.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Where this venue is located (e.g., a floor inside a building)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Map Pin Position on Parent</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={location.mapX}
                      onChange={(e) => setLocation(prev => ({ ...prev, mapX: parseFloat(e.target.value) || 50 }))}
                      placeholder="X %"
                    />
                    <p className="text-xs text-muted-foreground mt-1">X (% from left)</p>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={location.mapY}
                      onChange={(e) => setLocation(prev => ({ ...prev, mapY: parseFloat(e.target.value) || 50 }))}
                      placeholder="Y %"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Y (% from top)</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Position of this venue's pin on the parent map (0-100%)
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <ImageUploadField
                propertyId={propertyId}
                label="Map Image for This Venue"
                value={mapImageUrl}
                onUpload={(mediaId, url) => {
                  setMapImageUrl(url)
                  setMapImageMediaId(mediaId)
                }}
                onRemove={() => {
                  setMapImageUrl("")
                  setMapImageMediaId("")
                }}
                aspectRatio="4/3"
                helpText="Upload a map showing child venues inside this space. Used when visitors click into this venue."
              />
            </div>

            {mapImageUrl && childVenues.length > 0 && (
              <div className="border-t pt-4">
                <Label className="mb-2 block">Child Venues on This Map</Label>
                <div className="space-y-2">
                  {childVenues.map((child) => (
                    <div key={child.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{child.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Pin: {child.location?.mapX?.toFixed(1) || "50"}%, {child.location?.mapY?.toFixed(1) || "50"}%
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Edit child venues to adjust their pin positions on this map
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Media Manager */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Media & Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-sm text-muted-foreground">
              Configure hero photos, galleries, and floorplans. These will be used on admin and client pages.
            </div>
            <VenueMediaManager
              venueId={venue?.id ?? "new-venue"}
              propertyId={propertyId}
              initialMedia={mediaLinks}
              onChange={setMediaLinks}
            />
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
