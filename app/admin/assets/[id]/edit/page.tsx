import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { AssetForm } from "@/components/admin/asset-form"

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: asset, error } = await supabase
    .from("assets")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !asset) {
    notFound()
  }

  return (
    <div className="max-w-4xl">
      <AssetForm asset={asset} propertyId={asset.property_id} mode="edit" />
    </div>
  )
}
