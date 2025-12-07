import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ClientVisitView } from "@/components/client/client-visit-view"
import { ArrowLeft } from "lucide-react"
import { getBrandingConfig } from "@/lib/branding/config"

export default async function ClientVisitPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()
  const branding = getBrandingConfig()

  // Find visit by share token
  const { data: visit, error } = await supabase.from("site_visits").select("*").eq("share_token", token).single()

  if (error || !visit) {
    notFound()
  }

  // Fetch stops with venues
  const { data: stops } = await supabase
    .from("visit_stops")
    .select(`
      *,
      venue:venues(
        *,
        venue_media(
          *,
          media:media_library(*)
        )
      )
    `)
    .eq("site_visit_id", visit.id)
    .order("order_index")

  // Fetch property
  const { data: property } = await supabase.from("properties").select("*").eq("id", visit.property_id).single()

  // Fetch relevant assets for this visit (client-facing resources)
  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("property_id", visit.property_id)
    .eq("is_active", true)
    .order("sort_order")
    .order("view_count", { ascending: false })

  return (
    <div className="min-h-svh bg-background">
      {/* Hero Header */}
      <header className="relative">
        <div className="relative h-48 md:h-64 bg-secondary">
          <Image
            src={branding.images.visitHeroDefault}
            alt={branding.property.name}
            fill
            className="object-cover opacity-80"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
        </div>

        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="text-right">
              <p className="text-primary-foreground/70 text-[10px] tracking-[0.2em] uppercase">{branding.property.shortName.split(' ')[0]}</p>
              <p className="text-primary-foreground text-sm font-light">{branding.property.shortName.split(' ').slice(1).join(' ')}</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-primary/80 text-xs font-medium tracking-[0.2em] uppercase mb-2">Site Visit</p>
            <h1 className="font-serif text-2xl md:text-3xl text-primary-foreground font-light">
              {visit.client_company}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <ClientVisitView visit={visit} stops={stops || []} property={property} assets={assets || []} />
    </div>
  )
}
