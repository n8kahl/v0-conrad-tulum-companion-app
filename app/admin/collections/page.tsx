import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FolderOpen } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function CollectionsPage() {
  const supabase = await createClient()

  const { data: collections, error } = await supabase
    .from("collections")
    .select("*")
    .order("sort_order", { ascending: true })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground">Collections</h1>
          <p className="text-muted-foreground text-sm mt-1">Curated bundles of assets for different use cases</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/admin/collections/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Collection
          </Link>
        </Button>
      </div>

      {/* Collections Grid */}
      {error ? (
        <div className="text-destructive">Error loading collections: {error.message}</div>
      ) : collections && collections.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link key={collection.id} href={`/admin/collections/${collection.id}`}>
              <Card className="group overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
                {/* Cover Image */}
                <div className="relative aspect-video bg-muted">
                  {collection.cover_image_url ? (
                    <Image
                      src={collection.cover_image_url || "/placeholder.svg"}
                      alt={collection.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {collection.name}
                  </h3>
                  {collection.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{collection.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {collection.asset_ids?.length || 0} asset{collection.asset_ids?.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No collections yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Create your first collection to organize assets.</p>
        </div>
      )}
    </div>
  )
}
