import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { RecapView } from "@/components/recap/recap-view"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function RecapPage({
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

  // Fetch stops with venues
  const { data: stops } = await supabase
    .from("visit_stops")
    .select("*, venue:venues(*)")
    .eq("site_visit_id", visit.id)
    .order("order_index")

  // Fetch property
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", visit.property_id)
    .single()

  const favoritedCount = stops?.filter((s) => s.client_favorited).length || 0

  return (
    <div className="min-h-svh bg-background">
      {/* Hero Header */}
      <header className="relative print:hidden">
        <div className="relative h-56 md:h-72 bg-secondary">
          <Image
            src="/luxury-resort-ocean-view-sunset-conrad-tulum-aeria.jpg"
            alt="Conrad Tulum Riviera Maya"
            fill
            className="object-cover opacity-80"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
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
              Site Visit Recap
            </p>
            <h1 className="font-serif text-2xl md:text-4xl text-primary-foreground font-light">
              {visit.client_company}
            </h1>
            {favoritedCount > 0 && (
              <p className="text-primary-foreground/70 text-sm mt-2">
                {favoritedCount} venue{favoritedCount !== 1 ? "s" : ""} favorited
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Print Header */}
      <header className="hidden print:block p-8 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
              Conrad Tulum Riviera Maya
            </p>
            <h1 className="text-2xl font-semibold mt-1">{visit.client_company}</h1>
            <p className="text-muted-foreground text-sm mt-1">Site Visit Recap</p>
          </div>
          <div className="text-right">
            {visit.visit_date && (
              <p className="text-sm">
                {new Date(visit.visit_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <RecapView visit={visit} stops={stops || []} property={property} />

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 print:hidden md:hidden">
        <Button
          size="lg"
          className="rounded-full shadow-lg h-14 w-14"
          onClick={() => {
            const subject = encodeURIComponent(`Proposal Request - ${visit.client_company}`)
            window.location.href = `mailto:groups@conradhotels.com?subject=${subject}`
          }}
        >
          <ExternalLink className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
