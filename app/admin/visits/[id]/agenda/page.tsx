import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { AgendaBuilderClient } from "./agenda-client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function AgendaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }

  // Fetch visit
  const { data: visit, error } = await supabase
    .from("site_visits")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !visit) {
    notFound()
  }

  // Fetch stops with venues
  const { data: stops } = await supabase
    .from("visit_stops")
    .select("*, venue:venues(*)")
    .eq("site_visit_id", id)
    .order("order_index")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/visits/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-light text-foreground">
            Agenda Builder
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {visit.client_company}
          </p>
        </div>
      </div>

      {/* Agenda Builder */}
      <AgendaBuilderClient visit={visit} initialStops={stops || []} />
    </div>
  )
}
