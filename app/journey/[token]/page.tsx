import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { JourneyTimeline } from "@/components/journey/journey-timeline"
import { ArrowLeft, MapPin } from "lucide-react"

export default async function JourneyPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  // Find visit by share token
  const { data: visit, error } = await supabase
    .from("site_visits")
    .select("*")
    .eq("share_token", token)
    .single()

  if (error || !visit) {
    notFound()
  }

  // Fetch property
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", visit.property_id)
    .single()

  // Fetch first venue from tour
  const { data: firstStop } = await supabase
    .from("visit_stops")
    .select("*, venue:venues(*)")
    .eq("site_visit_id", visit.id)
    .order("order_index")
    .limit(1)
    .single()

  return (
    <div className="min-h-svh bg-background">
      {/* Hero Header */}
      <header className="relative">
        <div className="relative h-48 md:h-64 bg-secondary">
          <Image
            src="/luxury-resort-ocean-view-sunset-conrad-tulum-aeria.jpg"
            alt="Conrad Tulum Riviera Maya"
            fill
            className="object-cover opacity-80"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
        </div>

        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          <div className="flex items-center justify-between">
            <Link
              href={`/visit/${token}`}
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Visit
            </Link>
            <div className="text-right">
              <p className="text-primary-foreground/70 text-[10px] tracking-[0.2em] uppercase">
                Conrad
              </p>
              <p className="text-primary-foreground text-sm font-light">
                Tulum Riviera Maya
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-primary/80 text-xs font-medium tracking-[0.2em] uppercase mb-2">
              Your Journey
            </p>
            <h1 className="font-serif text-2xl md:text-3xl text-primary-foreground font-light">
              Gate-to-Gate Experience
            </h1>
            <p className="text-primary-foreground/70 text-sm mt-2">
              {visit.client_company}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8 max-w-2xl mx-auto">
        {/* Journey Timeline */}
        <JourneyTimeline
          property={property}
          firstVenue={firstStop?.venue || null}
        />

        {/* Quick Links */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href={`/visit/${token}`}
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="p-2 rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Tour Itinerary</p>
              <p className="text-sm text-muted-foreground">
                View your venue tour schedule
              </p>
            </div>
          </Link>

          <Link
            href={`/recap/${token}`}
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="p-2 rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Visit Recap</p>
              <p className="text-sm text-muted-foreground">
                Review your favorited venues
              </p>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            {property?.location?.address}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            &copy; {new Date().getFullYear()} Conrad Hotels & Resorts
          </p>
        </footer>
      </main>
    </div>
  )
}
