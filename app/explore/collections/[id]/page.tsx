import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { ContentHubHeader } from "@/components/public/content-hub-header"
import { AssetCarousel } from "@/components/public/asset-carousel"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderOpen } from "lucide-react"

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: collection, error } = await supabase.from("collections").select("*").eq("id", id).single()

  if (error || !collection) {
    notFound()
  }

  // Fetch assets in this collection
  let assets = []
  if (collection.asset_ids && collection.asset_ids.length > 0) {
    const { data } = await supabase.from("assets").select("*").in("id", collection.asset_ids).eq("is_active", true)
    assets = data || []
  }

  return (
    <div className="min-h-svh bg-background">
      <ContentHubHeader />

      {/* Hero */}
      <section className="relative">
        <div className="relative h-64 md:h-80 bg-muted">
          {collection.cover_image_url ? (
            <Image
              src={collection.cover_image_url || "/placeholder.svg"}
              alt={collection.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <FolderOpen className="h-24 w-24 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Content overlaying hero */}
        <div className="relative -mt-24 px-6 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mb-4 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
          >
            <Link href="/explore">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Collections
            </Link>
          </Button>

          <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8">
            <h1 className="font-serif text-2xl md:text-3xl font-light text-foreground">{collection.name}</h1>
            {collection.description && (
              <p className="mt-3 text-muted-foreground leading-relaxed">{collection.description}</p>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              {assets.length} resource{assets.length !== 1 ? "s" : ""} in this collection
            </p>
          </div>
        </div>
      </section>

      {/* Assets */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-lg font-medium text-foreground mb-6">Resources</h2>
        {assets.length > 0 ? (
          <AssetCarousel assets={assets} />
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">No resources in this collection yet.</p>
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
