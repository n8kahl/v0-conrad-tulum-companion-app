import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, TrendingUp, FileText, Star, Calendar } from "lucide-react"
import Image from "next/image"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Get asset views in last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { data: popularAssets },
    { data: featuredAssets },
    { data: recentViews },
    { count: totalViews },
    { count: totalAssets },
    { data: categoryStats },
  ] = await Promise.all([
    // Top 10 most viewed assets
    supabase
      .from("assets")
      .select("id, name, asset_type, category, thumbnail_url, view_count")
      .eq("is_active", true)
      .order("view_count", { ascending: false })
      .limit(10),

    // Featured assets
    supabase
      .from("assets")
      .select("id, name, asset_type, category, thumbnail_url, view_count, is_featured")
      .eq("is_featured", true)
      .eq("is_active", true),

    // Recent views (last 7 days)
    supabase
      .from("asset_views")
      .select("id, viewed_at, asset_id")
      .gte("viewed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("viewed_at", { ascending: false })
      .limit(100),

    // Total views count
    supabase
      .from("asset_views")
      .select("*", { count: "exact", head: true }),

    // Total assets
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),

    // Views by category
    supabase
      .from("assets")
      .select("category, view_count")
      .eq("is_active", true),
  ])

  // Calculate category totals
  const categoryTotals: Record<string, number> = {}
  categoryStats?.forEach((asset) => {
    categoryTotals[asset.category] = (categoryTotals[asset.category] || 0) + (asset.view_count || 0)
  })

  // Calculate views by day for last 7 days
  const viewsByDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = date.toLocaleDateString("en-US", { weekday: "short" })
    viewsByDay[key] = 0
  }
  recentViews?.forEach((view) => {
    const date = new Date(view.viewed_at)
    const key = date.toLocaleDateString("en-US", { weekday: "short" })
    if (viewsByDay[key] !== undefined) {
      viewsByDay[key]++
    }
  })

  const maxDayViews = Math.max(...Object.values(viewsByDay), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Track asset views and engagement</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-semibold">{totalViews?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last 7 Days</p>
                <p className="text-2xl font-semibold">{recentViews?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Assets</p>
                <p className="text-2xl font-semibold">{totalAssets || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Featured</p>
                <p className="text-2xl font-semibold">{featuredAssets?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Views by Day Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Views Last 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {Object.entries(viewsByDay).map(([day, count]) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-primary/20 rounded-t transition-all"
                    style={{ height: `${(count / maxDayViews) * 100}%`, minHeight: count > 0 ? "8px" : "4px" }}
                  >
                    <div
                      className="w-full bg-primary rounded-t"
                      style={{ height: "100%" }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{day}</span>
                  <span className="text-xs font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Views by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Views by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => {
                  const maxCount = Math.max(...Object.values(categoryTotals), 1)
                  const percentage = (count / maxCount) * 100
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{category}</span>
                        <span className="text-muted-foreground">{count.toLocaleString()} views</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              {Object.keys(categoryTotals).length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">No view data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Popular Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Most Popular Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {popularAssets && popularAssets.length > 0 ? (
            <div className="divide-y">
              {popularAssets.map((asset, index) => (
                <div key={asset.id} className="flex items-center gap-4 py-3">
                  <span className="text-lg font-semibold text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <div className="w-16 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                    {asset.thumbnail_url ? (
                      <Image
                        src={asset.thumbnail_url}
                        alt={asset.name}
                        width={64}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{asset.name}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {asset.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {asset.asset_type}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{(asset.view_count || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">
              No view data yet. Views will appear here as users access your assets.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
