import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CollectionForm } from "@/components/admin/collection-form"

export default async function NewCollectionPage() {
  const supabase = await createClient()

  // Get the property (Conrad Tulum)
  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .single()

  if (!property) {
    redirect("/admin/collections")
  }

  return (
    <div className="max-w-5xl">
      <CollectionForm propertyId={property.id} mode="create" />
    </div>
  )
}
