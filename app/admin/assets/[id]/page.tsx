import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AssetDetailView } from "@/components/admin/asset-detail-view"

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: asset, error } = await supabase.from("assets").select("*").eq("id", id).single()

  if (error || !asset) {
    notFound()
  }

  return <AssetDetailView asset={asset} />
}
