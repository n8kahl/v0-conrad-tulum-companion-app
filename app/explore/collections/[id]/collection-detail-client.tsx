"use client"

import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/lib/contexts/language-context"
import { AssetCarousel } from "@/components/public/asset-carousel"
import { ShareButton } from "@/components/public/share-button"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderOpen, Globe } from "lucide-react"
import type { Asset } from "@/lib/supabase/types"

interface Collection {
  id: string
  name: string
  description: string | null
  cover_image_url: string | null
}

interface CollectionDetailClientProps {
  collection: Collection
  assets: Asset[]
}

export function CollectionDetailClient({ collection, assets }: CollectionDetailClientProps) {
  const { locale, setLocale, t } = useLanguage()

  const toggleLanguage = () => {
    setLocale(locale === "en" ? "es" : "en")
  }

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/explore/collections/${collection.id}?lang=${locale}`
    : `/explore/collections/${collection.id}`

  return (
    <>
      {/* Hero */}
      <section className="relative">
        <div className="relative h-64 md:h-80 bg-muted">
          {collection.cover_image_url ? (
            <Image
              src={collection.cover_image_url}
              alt={collection.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <FolderOpen className="h-24 w-24 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Content overlaying hero */}
        <div className="relative -mt-24 px-6 max-w-4xl mx-auto fade-in">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
            >
              <Link href="/explore">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("backToLibrary")}
              </Link>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className="gap-2 bg-background/80 backdrop-blur-sm"
              >
                <Globe className="h-4 w-4" />
                <span className="uppercase font-medium">{locale}</span>
              </Button>
              <ShareButton
                title={collection.name}
                text={collection.description || `Explore ${collection.name} from Conrad Tulum`}
                url={shareUrl}
                className="bg-background/80 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8 card-interactive">
            <h1 className="font-serif text-2xl md:text-3xl font-light text-foreground text-luxury">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="mt-3 text-muted-foreground prose-luxury">
                {collection.description}
              </p>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              {assets.length} {t("resources")} {locale === "es" ? "en esta colección" : "in this collection"}
            </p>
          </div>
        </div>
      </section>

      {/* Assets */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-lg font-medium text-foreground mb-6">{t("resources")}</h2>
        {assets.length > 0 ? (
          <div className="stagger-fade-in">
            <AssetCarousel assets={assets} />
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">
              {locale === "es"
                ? "No hay recursos en esta colección todavía."
                : "No resources in this collection yet."}
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            Carretera Cancún Tulum 307 · Tulum, Quintana Roo, México 77774
          </p>
          <p className="text-muted-foreground/70 text-xs mt-2">
            © {new Date().getFullYear()} Conrad Hotels & Resorts. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  )
}
