import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { ContentHubDashboard } from "./content-hub-dashboard"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ContentHubPage() {
  const supabase = await createClient()

  // Fetch media stats
  const { data: media } = await supabase
    .from("media_library")
    .select("id, file_type, file_size, tags, created_at")
    .order("created_at", { ascending: false })

  // Calculate stats
  const stats = {
    total: media?.length || 0,
    images: media?.filter((m) => m.file_type === "image").length || 0,
    videos: media?.filter((m) => m.file_type === "video").length || 0,
    documents: media?.filter((m) => m.file_type === "document").length || 0,
    audio: media?.filter((m) => m.file_type === "audio").length || 0,
    storageUsed: media?.reduce((acc, m) => acc + (m.file_size || 0), 0) || 0,
    untagged: media?.filter((m) => !m.tags || m.tags.length === 0).length || 0,
    recentCount: media?.filter((m) => {
      const created = new Date(m.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return created > weekAgo
    }).length || 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Hub</h1>
        <p className="text-muted-foreground">
          Manage all media files, documents, and assets
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ContentHubDashboard initialStats={stats} />
      </Suspense>
    </div>
  )
}
