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
  const assets = []

  if (collection.asset_ids && collection.asset_ids.length > 0) {
    const { data } = await supabase
      .from("assets")
      .select("*")
      .in("id", collection.asset_ids)
      .eq("is_active", true)

    if (data) {
      assets.push(...data)
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <ContentHubHeader />
      <CollectionDetailClient collection={collection} assets={assets} />
    </div>
  )
}
