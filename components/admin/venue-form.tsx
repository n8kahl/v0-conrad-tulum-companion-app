"use client"

import { useState } from "react"
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

const venueTypes = [
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
  const [images, setImages] = useState<string[]>(venue?.images || [])
  const [newImageUrl, setNewImageUrl] = useState("")
  const [floorplanUrl, setFloorplanUrl] = useState(venue?.floorplan_url || "")
  const [mapCoordinates, setMapCoordinates] = useState({
    x: venue?.map_coordinates?.x || 50,
    y: venue?.map_coordinates?.y || 50,
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

  const addImage = () => {
    if (newImageUrl.trim()) {
      setImages((prev) => [...prev, newImageUrl.trim()])
      setNewImageUrl("")
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
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
        images,
        floorplan_url: floorplanUrl || null,
        map_coordinates: mapCoordinates,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      }

      if (mode === "create") {
        const { error } = await supabase.from("venues").insert(venueData)
        if (error) throw error
        toast.success("Venue created successfully")
      } else {
        const { error } = await supabase
          .from("venues")
          .update(venueData)
          .eq("id", venue?.id)
        if (error) throw error
        toast.success("Venue updated successfully")
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

            <div className="space-y-2">
              <Label htmlFor="floorplan">Floorplan URL</Label>
              <Input
                id="floorplan"
                value={floorplanUrl}
                onChange={(e) => setFloorplanUrl(e.target.value)}
                placeholder="https://..."
              />
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

        {/* Images */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Enter image URL..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addImage()
                  }
                }}
              />
              <Button type="button" onClick={addImage} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((url, index) => (
                  <div
                    key={index}
                    className="group relative rounded-lg overflow-hidden border border-border"
                  >
                    <img
                      src={url}
                      alt={`Venue image ${index + 1}`}
                      className="w-24 h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
