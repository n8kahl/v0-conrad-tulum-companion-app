import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Helper to get hero image URL from venue media or fallback to legacy field
function getHeroImageUrl(venue: any): string | null {
  const toUrl = (path?: string | null) => {
    if (!path) return null
    return path.startsWith("http://") || path.startsWith("https://")
      ? path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${path}`
  }

  const heroMedia = venue.venue_media?.find(
    (vm: any) => vm.context === "hero" && vm.is_primary
  ) ?? venue.venue_media?.find(
    (vm: any) => vm.context === "hero"
  )
  
  const media = heroMedia?.media
  
  return (
    toUrl(media?.thumbnail_path) ??
    toUrl(media?.storage_path) ??
    venue.images?.[0] ??
    null
  )
}

export default async function VenuesPage() {
  const supabase = await createClient()

  const { data: venues, error } = await supabase
    .from("venues")
    .select(`
      *,
      venue_media(
        id,
        context,
        is_primary,
        display_order,
        show_on_public,
        media:media_library(
          storage_path,
          thumbnail_path,
          alt_text
        )
      )
    `)
    .order("name", { ascending: true })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground">Venues</h1>
          <p className="text-muted-foreground text-sm mt-1">Meeting rooms, outdoor spaces, and event areas</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/admin/venues/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Venue
          </Link>
        </Button>
      </div>

      {/* Venues Grid */}
      {error ? (
        <div className="text-destructive">Error loading venues: {error.message}</div>
      ) : venues && venues.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <Link key={venue.id} href={`/admin/venues/${venue.id}`}>
              <Card className="group overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
                {/* Image */}
                <div className="relative aspect-video bg-muted">
                  {getHeroImageUrl(venue) ? (
                    <Image
                      src={getHeroImageUrl(venue)!}
                      alt={venue.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs capitalize">
                    {venue.venue_type.replace("_", " ")}
                  </Badge>
                </div>

                {/* Content */}
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {venue.name}
                  </h3>
                  {venue.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{venue.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    {venue.dimensions?.sqm && (
                      <span>
                        {venue.dimensions.sqm} m<sup>2</sup>
                      </span>
                    )}
                    {venue.capacities?.reception && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {venue.capacities.reception} reception
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No venues yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Add venues to include in site visit tours.</p>
        </div>
      )}
    </div>
  )
}
