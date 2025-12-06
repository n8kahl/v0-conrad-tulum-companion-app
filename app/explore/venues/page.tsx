import { createClient } from "@/lib/supabase/server"
import { ContentHubHeader } from "@/components/public/content-hub-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function PublicVenuesPage() {
  const supabase = await createClient()

  const { data: venues } = await supabase
    .from("venues")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })

  return (
    <div className="min-h-svh bg-background">
      <ContentHubHeader />

      {/* Header */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-primary text-xs font-medium tracking-[0.3em] uppercase mb-3">Conrad Tulum</p>
          <h1 className="font-serif text-3xl md:text-4xl font-light text-foreground leading-tight">
            Event Venues & Spaces
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Discover our stunning collection of indoor and outdoor venues, each designed to create unforgettable
            experiences.
          </p>
        </div>

        {/* Venues Grid */}
        {venues && venues.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => (
              <Link key={venue.id} href={`/explore/venues/${venue.id}`}>
                <Card className="group overflow-hidden transition-all hover:shadow-lg hover:border-primary/20 h-full">
                  {/* Image */}
                  <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                    {venue.images && venue.images[0] ? (
                      <Image
                        src={venue.images[0] || "/placeholder.svg"}
                        alt={venue.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <Badge className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm capitalize">
                      {venue.venue_type.replace("_", " ")}
                    </Badge>
                  </div>

                  {/* Content */}
                  <CardContent className="p-5">
                    <h3 className="font-serif text-lg text-foreground group-hover:text-primary transition-colors">
                      {venue.name}
                    </h3>
                    {venue.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{venue.description}</p>
                    )}
                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      {venue.dimensions?.sqm && (
                        <span>
                          {venue.dimensions.sqm} m<sup>2</sup>
                        </span>
                      )}
                      {venue.capacities?.reception && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Up to {venue.capacities.reception}
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
            <p className="mt-4 text-muted-foreground">No venues available yet.</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border">
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
