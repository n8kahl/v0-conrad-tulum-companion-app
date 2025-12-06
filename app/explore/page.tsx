import { createClient } from "@/lib/supabase/server"
import { ContentHubHeader } from "@/components/public/content-hub-header"
import { CollectionCard } from "@/components/public/collection-card"
import { AssetCarousel } from "@/components/public/asset-carousel"
import { PopularAssets } from "@/components/public/popular-assets"

export default async function ExplorePage() {
  const supabase = await createClient()

  const [collectionsResult, featuredResult, popularResult] = await Promise.all([
    supabase.from("collections").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("assets").select("*").eq("is_active", true).eq("is_featured", true).order("name").limit(4),
    supabase.from("assets").select("*").eq("is_active", true).order("view_count", { ascending: false }).limit(8),
  ])

  const collections = collectionsResult.data || []
  const featuredAssets = featuredResult.data || []
  const popularAssets = popularResult.data || []

  // Log errors for debugging (these will show in server console)
  if (collectionsResult.error) {
    console.error("Error fetching collections:", collectionsResult.error)
  }
  if (featuredResult.error) {
    console.error("Error fetching featured assets:", featuredResult.error)
  }
  if (popularResult.error) {
    console.error("Error fetching popular assets:", popularResult.error)
  }

  return (
    <div className="min-h-svh bg-background">
      <ContentHubHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent h-64" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent blur-3xl -z-10" />
        <div className="relative px-6 py-12 max-w-6xl mx-auto fade-in">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-primary text-xs font-medium tracking-[0.3em] uppercase mb-3 shimmer-gold inline-block px-2">
              Conrad Tulum Riviera Maya
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-light text-foreground leading-tight text-balance text-luxury">
              Explore Our Sales & Event Resources
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed prose-luxury">
              Discover comprehensive materials to help plan your perfect group experience at Conrad Tulum.
            </p>
          </div>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="px-6 py-8 max-w-6xl mx-auto">
        <h2 className="text-lg font-medium text-foreground mb-6">Collections</h2>
        {collections.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-fade-in">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No collections available yet.</p>
        )}
      </section>

      {/* Staff Picks / Featured */}
      {featuredAssets.length > 0 && (
        <section className="px-6 py-8 max-w-6xl mx-auto">
          <PopularAssets
            assets={featuredAssets.map(a => ({ ...a, is_featured: true }))}
            title="Staff Picks"
          />
        </section>
      )}

      {/* Popular Materials */}
      {popularAssets.length > 0 && (
        <section className="px-6 py-8 max-w-6xl mx-auto">
          <h2 className="text-lg font-medium text-foreground mb-6">Popular Materials</h2>
          <AssetCarousel assets={popularAssets} />
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
