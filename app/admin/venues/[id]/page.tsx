import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { VenueForm } from "@/components/admin/venue-form"

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: venue, error } = await supabase
    .from("venues")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !venue) {
    notFound()
  }

  return (
    <div className="max-w-4xl">
      <VenueForm venue={venue} propertyId={venue.property_id} mode="edit" />
    </div>
  )
}
