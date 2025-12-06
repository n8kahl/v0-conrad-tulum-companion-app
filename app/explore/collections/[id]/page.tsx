import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ContentHubHeader } from "@/components/public/content-hub-header"
import { CollectionDetailClient } from "./collection-detail-client"

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: collection, error } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !collection) {
    notFound()
  }

  // Fetch assets in this collection
  let assets: Array<{
    id: string
    name: string
    asset_type: string
    category: string
    thumbnail_url: string | null
    description: string | null
    urls: Record<string, string> | null
  }> = []

  if (collection.asset_ids && collection.asset_ids.length > 0) {
    const { data } = await supabase
      .from("assets")
      .select("id, name, asset_type, category, thumbnail_url, description, urls")
      .in("id", collection.asset_ids)
      .eq("is_active", true)

    assets = data || []
  }

  return (
    <div className="min-h-svh bg-background">
      <ContentHubHeader />
      <CollectionDetailClient collection={collection} assets={assets} />
    </div>
  )
}
