import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Users, Building2, Copy } from "lucide-react"
import Link from "next/link"

const statusColors: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  proposal_sent: "bg-primary/10 text-primary",
}

export default async function VisitsPage() {
  const supabase = await createClient()

  const { data: visits, error } = await supabase
    .from("site_visits")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground">Site Visits</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage client site inspections and tours</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/admin/visits/new">
            <Plus className="mr-2 h-4 w-4" />
            New Site Visit
          </Link>
        </Button>
      </div>

      {/* Visits List */}
      {error ? (
        <div className="text-destructive">Error loading visits: {error.message}</div>
      ) : visits && visits.length > 0 ? (
        <div className="space-y-4">
          {visits.map((visit) => (
            <Link key={visit.id} href={`/admin/visits/${visit.id}`}>
              <Card className="transition-all hover:shadow-md hover:border-primary/20">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-foreground">{visit.client_company}</h3>
                        <Badge className={`text-xs ${statusColors[visit.status] || statusColors.planning}`}>
                          {visit.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 capitalize">
                          <Building2 className="h-4 w-4" />
                          {visit.group_type}
                        </span>
                        {visit.estimated_attendees && (
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {visit.estimated_attendees} attendees
                          </span>
                        )}
                        {visit.visit_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(visit.visit_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <Copy className="h-3 w-3" />
                        {visit.share_token?.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No site visits yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Create your first site visit to get started.</p>
          <Button asChild className="mt-4 bg-primary hover:bg-primary/90">
            <Link href="/admin/visits/new">
              <Plus className="mr-2 h-4 w-4" />
              New Site Visit
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
