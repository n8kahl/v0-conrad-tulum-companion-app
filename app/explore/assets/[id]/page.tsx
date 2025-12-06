import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { ContentHubHeader } from "@/components/public/content-hub-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ExternalLink, Download, FileText, Video, ImageIcon, Globe, Layout } from "lucide-react"

const assetTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  flipbook: Layout,
  image: ImageIcon,
  video: Video,
  virtual_tour: Globe,
  diagram: Layout,
}

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

  const TypeIcon = assetTypeIcons[asset.asset_type] || FileText

  return (
    <div className="min-h-svh bg-background">
      <ContentHubHeader />

      <main className="px-6 py-8 max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/explore">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Preview */}
          <div>
            <div className="relative aspect-[4/3] rounded-2xl bg-muted overflow-hidden">
              {asset.thumbnail_url ? (
                <Image src={asset.thumbnail_url || "/placeholder.svg"} alt={asset.name} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <TypeIcon className="h-20 w-20 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="capitalize">
                  {asset.asset_type.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {asset.category}
                </Badge>
                <Badge variant="outline" className="uppercase">
                  {asset.language}
                </Badge>
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-light text-foreground">{asset.name}</h1>
              {asset.description && <p className="mt-3 text-muted-foreground leading-relaxed">{asset.description}</p>}
            </div>

            {/* Tags */}
            {asset.tags && asset.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {asset.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Links */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Access Materials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(asset.urls).map(([key, value]) => {
                  if (!value) return null
                  const isDownload = key.includes("pdf")
                  return (
                    <a
                      key={key}
                      href={value as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium capitalize text-foreground">{key.replace(/_/g, " ")}</span>
                      {isDownload ? (
                        <Download className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      )}
                    </a>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            Carretera Cancún Tulum 307 · Tulum, Quintana Roo, México 77774
          </p>
          <p className="text-muted-foreground/70 text-xs mt-2">
            © {new Date().getFullYear()} Conrad Hotels & Resorts. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
