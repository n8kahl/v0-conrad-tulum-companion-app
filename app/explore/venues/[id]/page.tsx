import { createClient } from "@/lib/supabase/server"
import { ContentHubHeader } from "@/components/public/content-hub-header"
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

      {/* Hero Section */}
      <section className="px-6 py-8 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
              {venue.images && venue.images[0] ? (
                <Image
                  src={venue.images[0]}
                  alt={venue.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
            {venue.images && venue.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {venue.images.slice(1, 5).map((img: string, idx: number) => (
                  <div key={idx} className="relative aspect-square bg-muted rounded-md overflow-hidden">
                    <Image
                      src={img}
                      alt={`${venue.name} ${idx + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-3 capitalize">{venue.venue_type.replace("_", " ")}</Badge>
              <h1 className="font-serif text-3xl md:text-4xl font-light text-foreground">
                {venue.name}
              </h1>
              {venue.description && (
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {venue.description}
                </p>
              )}
            </div>

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
                      <div>
                        <span className="text-muted-foreground">Area:</span>
                        <span className="ml-2 font-medium">{venue.dimensions.sqm} m²</span>
                      </div>
                    )}
                    {venue.dimensions.length_m && (
                      <div>
                        <span className="text-muted-foreground">Length:</span>
                        <span className="ml-2 font-medium">{venue.dimensions.length_m} m</span>
                      </div>
                    )}
                    {venue.dimensions.width_m && (
                      <div>
                        <span className="text-muted-foreground">Width:</span>
                        <span className="ml-2 font-medium">{venue.dimensions.width_m} m</span>
                      </div>
                    )}
                    {venue.dimensions.height_m && (
                      <div>
                        <span className="text-muted-foreground">Height:</span>
                        <span className="ml-2 font-medium">{venue.dimensions.height_m} m</span>
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
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(venue.capacities).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{capacityLabels[key] || key}:</span>
                        <span className="font-medium">{value as number}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            {venue.features && venue.features.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground mb-3">Features</h3>
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
        </div>
      </section>

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
