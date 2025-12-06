import { createClient } from "@/lib/supabase/server"
import { ContentHubHeader } from "@/components/public/content-hub-header"
import { SearchResults } from "./search-results"

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string; type?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query based on search params
  let query = supabase.from("assets").select("*").eq("is_active", true)

  // Apply text search if provided
  if (params.q) {
    query = query.or(
      `name.ilike.%${params.q}%,description.ilike.%${params.q}%`
    )
  }

  // Apply category filter
  if (params.category) {
    query = query.eq("category", params.category)
  }

  // Apply type filter
  if (params.type) {
    query = query.eq("asset_type", params.type)
  }

  const { data: assets, error } = await query.order("name", { ascending: true })

  if (error) {
    console.error("Error searching assets:", error)
  }

  // Get all categories and types for filters
  const { data: allAssets } = await supabase
    .from("assets")
    .select("category, asset_type")
    .eq("is_active", true)

  const categories = [...new Set((allAssets || []).map((a) => a.category))].sort()
  const assetTypes = [...new Set((allAssets || []).map((a) => a.asset_type))].sort()

  return (
    <div className="min-h-svh bg-background">
      <ContentHubHeader />

      {/* Search Section */}
      <section className="px-6 py-8 max-w-6xl mx-auto">
        <SearchResults
          initialAssets={assets || []}
          initialQuery={params.q || ""}
          initialCategory={params.category || ""}
          initialType={params.type || ""}
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
