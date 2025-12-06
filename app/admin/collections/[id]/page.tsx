import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { CollectionForm } from "@/components/admin/collection-form"

export default async function EditCollectionPage({
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

  return (
    <div className="max-w-5xl">
      <CollectionForm
        collection={collection}
        propertyId={collection.property_id}
        mode="edit"
      />
    </div>
  )
}
