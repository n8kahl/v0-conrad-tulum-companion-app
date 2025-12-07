import { createClient } from "@/lib/supabase/server"
import { ContentHubHeader } from "@/components/public/content-hub-header"
import { ImmersiveViewer } from "@/components/venue/immersive-viewer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Users, Maximize, ArrowLeft, Check } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"

interface VenuePageProps {
  params: Promise<{ id: string }>
}

export default async function VenueDetailPage({ params }: VenuePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: venue, error } = await supabase
    .from("venues")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !venue) {
    notFound()
  }

  // Capacity configurations
  const capacityLabels: Record<string, string> = {
    theater: "Theater",
    classroom: "Classroom",
    banquet: "Banquet",
    reception: "Reception",
    u_shape: "U-Shape",
    boardroom: "Boardroom",
    ceremony: "Ceremony",
    wellness_group: "Wellness Group",
    buyout: "Buyout",
    casual_dining: "Casual Dining",
    networking: "Networking",
  }

  // Check if venue has a hero image for immersive viewing
  const heroImage = venue.images?.[0]
  const hasMultipleImages = venue.images && venue.images.length > 1

  return (
    <div className="min-h-svh bg-background">
      <ContentHubHeader />

      {/* Back Button */}
      <div className="px-6 pt-6 max-w-6xl mx-auto">
        <Link href="/explore/venues">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Venues
          </Button>
        </Link>
      </div>

      {/* Immersive Hero Section */}
      {heroImage && (
        <section className="px-6 py-6 max-w-6xl mx-auto">
          <ImmersiveViewer
            imageUrl={heroImage}
            title={venue.name}
            description={venue.description || undefined}
          />
        </section>
      )}

      {/* Secondary Images Gallery */}
      {hasMultipleImages && (
        <section className="px-6 pb-4 max-w-6xl mx-auto">
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {venue.images.slice(1, 7).map((img: string, idx: number) => (
              <div
                key={idx}
                className="relative aspect-square bg-muted rounded-lg overflow-hidden group cursor-pointer"
              >
                <Image
                  src={img}
                  alt={`${venue.name} ${idx + 2}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Venue Details */}
      <section className="px-6 py-8 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Description */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-3 capitalize">
                {venue.venue_type.replace("_", " ")}
              </Badge>
              <h1 className="font-serif text-3xl md:text-4xl font-light text-foreground">
                {venue.name}
              </h1>
              {venue.description && (
                <p className="mt-4 text-muted-foreground leading-relaxed text-lg">
                  {venue.description}
                </p>
              )}
            </div>

            {/* Features */}
            {venue.features && venue.features.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground mb-3">Features & Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {venue.features.map((feature: string) => (
                      <Badge key={feature} variant="secondary" className="capitalize">
                        <Check className="h-3 w-3 mr-1" />
                        {feature.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Floorplan */}
            {venue.floorplan_url && (
              <Button asChild className="w-full">
                <a href={venue.floorplan_url} target="_blank" rel="noopener noreferrer">
                  View Floorplan
                </a>
              </Button>
            )}
          </div>

          {/* Right Column - Specs */}
          <div className="space-y-6">
            {/* Dimensions */}
            {venue.dimensions && Object.keys(venue.dimensions).length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Maximize className="h-4 w-4" />
                    Dimensions
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {venue.dimensions.sqm && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground block text-xs">Area</span>
                        <span className="font-semibold text-lg">{venue.dimensions.sqm} m²</span>
                      </div>
                    )}
                    {venue.dimensions.length_m && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground block text-xs">Length</span>
                        <span className="font-semibold text-lg">{venue.dimensions.length_m} m</span>
                      </div>
                    )}
                    {venue.dimensions.width_m && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground block text-xs">Width</span>
                        <span className="font-semibold text-lg">{venue.dimensions.width_m} m</span>
                      </div>
                    )}
                    {venue.dimensions.height_m && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground block text-xs">Height</span>
                        <span className="font-semibold text-lg">{venue.dimensions.height_m} m</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Capacities */}
            {venue.capacities && Object.keys(venue.capacities).length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Capacity Configurations
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(venue.capacities).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center p-2 bg-muted/30 rounded-lg"
                      >
                        <span className="text-muted-foreground text-sm">
                          {capacityLabels[key] || key}
                        </span>
                        <Badge variant="secondary" className="font-semibold">
                          {value as number}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* No Hero Image Fallback */}
      {!heroImage && (
        <section className="px-6 py-8 max-w-6xl mx-auto">
          <div className="aspect-[16/9] bg-muted rounded-xl flex items-center justify-center">
            <MapPin className="h-16 w-16 text-muted-foreground/30" />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            Carretera Cancún Tulum 307 · Tulum, Quintana Roo, México 77774
          </p>
          <p className="text-muted-foreground/70 text-xs mt-2">
            © {new Date().getFullYear()} Conrad Hotels & Resorts. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
