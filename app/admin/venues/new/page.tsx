import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VenueForm } from "@/components/admin/venue-form"

export default async function NewVenuePage() {
  const supabase = await createClient()

  // Get the property (Conrad Tulum)
  const { data: property } = await supabase
    .from("properties")
    .select("id")
    .single()

  if (!property) {
    redirect("/admin/venues")
  }

  return (
    <div className="max-w-4xl">
      <VenueForm propertyId={property.id} mode="create" />
    </div>
  )
}
