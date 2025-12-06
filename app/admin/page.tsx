import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FolderOpen, MapPin, Calendar, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch counts
  const [assetsResult, collectionsResult, venuesResult, visitsResult] = await Promise.all([
    supabase.from("assets").select("id", { count: "exact", head: true }),
    supabase.from("collections").select("id", { count: "exact", head: true }),
    supabase.from("venues").select("id", { count: "exact", head: true }),
    supabase.from("site_visits").select("id", { count: "exact", head: true }),
  ])

  const stats = [
    {
      label: "Assets",
      value: assetsResult.count ?? 0,
      icon: FileText,
      href: "/admin/assets",
      color: "text-primary",
    },
    {
      label: "Collections",
      value: collectionsResult.count ?? 0,
      icon: FolderOpen,
      href: "/admin/collections",
      color: "text-accent",
    },
    {
      label: "Venues",
      value: venuesResult.count ?? 0,
      icon: MapPin,
      href: "/admin/venues",
      color: "text-chart-2",
    },
    {
      label: "Site Visits",
      value: visitsResult.count ?? 0,
      icon: Calendar,
      href: "/admin/visits",
      color: "text-chart-3",
    },
  ]

  // Fetch recent site visits
  const { data: recentVisits } = await supabase
    .from("site_visits")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome to Conrad Tulum Site Visit Companion</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-all hover:shadow-md hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-light">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/admin/visits/new"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Create Site Visit</p>
                <p className="text-sm text-muted-foreground">Plan a new client visit</p>
              </div>
            </Link>
            <Link
              href="/admin/assets"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground">Manage Assets</p>
                <p className="text-sm text-muted-foreground">Upload and organize materials</p>
              </div>
            </Link>
            <Link
              href="/explore"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <Users className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="font-medium text-foreground">View Content Hub</p>
                <p className="text-sm text-muted-foreground">See the public-facing library</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Site Visits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Recent Site Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentVisits && recentVisits.length > 0 ? (
              <div className="space-y-3">
                {recentVisits.map((visit) => (
                  <Link
                    key={visit.id}
                    href={`/admin/visits/${visit.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{visit.client_company}</p>
                      <p className="text-sm text-muted-foreground capitalize">{visit.group_type}</p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        visit.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : visit.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {visit.status.replace("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No site visits yet</p>
                <Link href="/admin/visits/new" className="text-primary text-sm hover:underline mt-2 inline-block">
                  Create your first visit
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
