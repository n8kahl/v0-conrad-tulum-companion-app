import type { Collection } from "@/lib/supabase/types"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, FolderOpen } from "lucide-react"

interface CollectionCardProps {
  collection: Collection
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={`/explore/collections/${collection.id}`}>
      <Card className="group overflow-hidden card-interactive gold-border-glow h-full">
        {/* Cover Image */}
        <div className="relative aspect-[16/10] bg-muted overflow-hidden">
          {collection.cover_image_url ? (
            <Image
              src={collection.cover_image_url || "/placeholder.svg"}
              alt={collection.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <FolderOpen className="h-12 w-12 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 className="font-serif text-xl text-white font-light">{collection.name}</h3>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-5">
          {collection.description && (
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{collection.description}</p>
          )}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {collection.asset_ids?.length || 0} resource{collection.asset_ids?.length !== 1 ? "s" : ""}
            </span>
            <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Explore
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
