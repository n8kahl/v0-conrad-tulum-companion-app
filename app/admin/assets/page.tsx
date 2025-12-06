import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { AssetGrid } from "@/components/admin/asset-grid"
import { AssetFilters } from "@/components/admin/asset-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; type?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query
  let query = supabase.from("assets").select("*").order("sort_order", { ascending: true })

  if (params.category) {
    query = query.eq("category", params.category)
  }
  if (params.type) {
    query = query.eq("asset_type", params.type)
  }
  if (params.search) {
    query = query.ilike("name", `%${params.search}%`)
  }

  const { data: assets, error } = await query

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground">Assets</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage sales materials, flipbooks, and media</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/admin/assets/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <AssetFilters />

      {/* Asset Grid */}
      <Suspense fallback={<div className="text-muted-foreground">Loading assets...</div>}>
        {error ? (
          <div className="text-destructive">Error loading assets: {error.message}</div>
        ) : (
          <AssetGrid assets={assets || []} />
        )}
      </Suspense>
    </div>
  )
}
