import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ContentHubHeader } from "@/components/public/content-hub-header"
import { AssetDetailClient } from "./asset-detail-client"

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: asset, error } = await supabase.from("assets").select("*").eq("id", id).single()

  if (error || !asset) {
    notFound()
  }

  return (
    <div className="min-h-svh bg-background">
      <ContentHubHeader />
      <AssetDetailClient asset={asset} />

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            Carretera Cancun Tulum 307 · Tulum, Quintana Roo, Mexico 77774
          </p>
          <p className="text-muted-foreground/70 text-xs mt-2">
            © {new Date().getFullYear()} Conrad Hotels & Resorts. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
