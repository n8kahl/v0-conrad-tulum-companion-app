import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AssetForm } from "@/components/admin/asset-form"

export default async function NewAssetPage() {
  const supabase = await createClient()

  // Get the property (Conrad Tulum)
  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .single()

  if (!property) {
    redirect("/admin/assets")
  }

  return (
    <div className="max-w-4xl">
      <AssetForm propertyId={property.id} mode="create" />
    </div>
  )
}
