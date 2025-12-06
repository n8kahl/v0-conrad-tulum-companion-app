import { createClient } from "@/lib/supabase/server"
import { ContentHubHeader } from "@/components/public/content-hub-header"
import { CollectionCard } from "@/components/public/collection-card"
import { AssetCarousel } from "@/components/public/asset-carousel"

export default async function ExplorePage() {
  const supabase = await createClient()

  const [{ data: collections }, { data: featuredAssets }] = await Promise.all([
    supabase.from("collections").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("assets").select("*").eq("is_active", true).order("sort_order", { ascending: true }).limit(8),
  ])

  return (
    <div className="min-h-svh bg-background">
      <ContentHubHeader />

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent h-64" />
        <div className="relative px-6 py-12 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-primary text-xs font-medium tracking-[0.3em] uppercase mb-3">
              Conrad Tulum Riviera Maya
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-light text-foreground leading-tight text-balance">
              Explore Our Sales & Event Resources
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Discover comprehensive materials to help plan your perfect group experience at Conrad Tulum.
            </p>
          </div>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="px-6 py-8 max-w-6xl mx-auto">
        <h2 className="text-lg font-medium text-foreground mb-6">Collections</h2>
        {collections && collections.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No collections available yet.</p>
        )}
      </section>

      {/* Featured Assets */}
      {featuredAssets && featuredAssets.length > 0 && (
        <section className="px-6 py-8 max-w-6xl mx-auto">
          <h2 className="text-lg font-medium text-foreground mb-6">Featured Materials</h2>
          <AssetCarousel assets={featuredAssets} />
        </section>
      )}

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
