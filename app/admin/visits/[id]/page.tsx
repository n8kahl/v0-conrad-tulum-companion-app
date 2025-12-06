import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SiteVisitDetail } from "@/components/admin/site-visit-detail"

// Function to validate UUID
function isValidUUID(str: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

export default async function SiteVisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (id === "new") {
    redirect("/admin/visits/new")
  }

  if (!isValidUUID(id)) {
    notFound()
  }

  const supabase = await createClient()

  const [{ data: visit, error }, { data: venues }] = await Promise.all([
    supabase.from("site_visits").select("*").eq("id", id).single(),
    supabase.from("venues").select("*").eq("is_active", true).order("name"),
  ])

  if (error || !visit) {
    notFound()
  }

  // Fetch stops for this visit
  const { data: stops } = await supabase
    .from("visit_stops")
    .select("*, venue:venues(*)")
    .eq("site_visit_id", id)
    .order("order_index")

  return <SiteVisitDetail visit={visit} venues={venues || []} stops={stops || []} />
}
