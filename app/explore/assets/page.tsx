import { createClient } from "@/lib/supabase/server"
import { ContentHubHeader } from "@/components/public/content-hub-header"
import { AssetGrid } from "./asset-grid"

export default async function AllAssetsPage() {
  const supabase = await createClient()

  const { data: assets, error } = await supabase
    .from("assets")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching assets:", error)
  }

  // Get unique categories for filter chips
  const categories = [...new Set((assets || []).map((a) => a.category))].sort()

  // Get unique asset types
  const assetTypes = [...new Set((assets || []).map((a) => a.asset_type))].sort()

  return (
    <div className="min-h-svh bg-background">
      <ContentHubHeader />

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent h-64" />
        <div className="relative px-6 py-12 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-primary text-xs font-medium tracking-[0.3em] uppercase mb-3">
              Resource Library
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-light text-foreground leading-tight text-balance">
              All Materials
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Browse our complete collection of sales materials, brochures, and digital resources.
            </p>
          </div>
        </div>
      </section>

      {/* Assets Grid with Filters */}
      <section className="px-6 py-8 max-w-6xl mx-auto">
        <AssetGrid
          assets={assets || []}
          categories={categories}
          assetTypes={assetTypes}
        />
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            Carretera Cancun Tulum 307 · Tulum, Quintana Roo, Mexico 77774
          </p>
          <p className="text-muted-foreground/70 text-xs mt-2">
            © {new Date().getFullYear()} Conrad Hotels & Resorts. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
