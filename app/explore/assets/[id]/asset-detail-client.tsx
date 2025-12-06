"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/contexts/language-context"
import { useTrackView } from "@/lib/hooks/use-track-view"
import { ContentRenderer } from "@/components/public/content-renderers"
import { ShareButton } from "@/components/public/share-button"
import { getAssetShareUrl } from "@/lib/sharing/share-utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Globe } from "lucide-react"

interface Asset {
  id: string
  name: string
  asset_type: string
  category: string
  language: string
  urls: Record<string, string>
  thumbnail_url: string | null
  tags: string[] | null
  description: string | null
}

export function AssetDetailClient({ asset }: { asset: Asset }) {
  const { locale, setLocale, t, getLocalizedUrl } = useLanguage()

  // Track view on mount
  useTrackView(asset.id)

  const shareUrl = getAssetShareUrl(asset.id, locale)

  const pdfUrl = getLocalizedUrl(asset.urls, "pdf") ||
    asset.urls?.[`pdf_${locale}`] ||
    asset.urls?.pdf

  // Toggle language
  const toggleLanguage = () => {
    setLocale(locale === "en" ? "es" : "en")
  }

  return (
    <main className="px-6 py-6 max-w-6xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/explore">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToLibrary")}
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            <span className="uppercase font-medium">{locale}</span>
          </Button>

          {/* Share Button */}
          <ShareButton
            title={asset.name}
            text={asset.description || `Check out ${asset.name} from Conrad Tulum`}
            url={shareUrl}
          />
        </div>
      </div>

      {/* Content Viewer */}
      <div className="fade-in">
        <ContentRenderer
          assetType={asset.asset_type as "flipbook" | "video" | "virtual_tour" | "document" | "link"}
          urls={asset.urls}
          title={asset.name}
          thumbnailUrl={asset.thumbnail_url || undefined}
          className="mb-8"
        />
      </div>

      {/* Asset Info */}
      <div className="space-y-6">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="capitalize">
            {asset.asset_type.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {asset.category}
          </Badge>
          {asset.language !== "both" && (
            <Badge variant="outline" className="uppercase">
              {asset.language}
            </Badge>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-light text-foreground text-luxury">
            {asset.name}
          </h1>
          {asset.description && (
            <p className="mt-3 text-muted-foreground prose-luxury">
              {asset.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {asset.tags
              .filter((tag) => !tag.startsWith("collection:"))
              .map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}

        {/* Download Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
          {pdfUrl && (
            <Button asChild variant="default" className="gap-2">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4" />
                {t("downloadPdf")}
              </a>
            </Button>
          )}

          {/* Show other URLs as secondary buttons */}
          {Object.entries(asset.urls)
            .filter(
              ([key, value]) =>
                value &&
                !key.includes("flipbook") &&
                !key.includes("pdf") &&
                key !== "tour_url" &&
                key !== "firstview" &&
                key !== "diagramming"
            )
            .map(([key, value]) => (
              <Button
                key={key}
                asChild
                variant="outline"
                className="gap-2 capitalize"
              >
                <a
                  href={value as string}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {key.replace(/_/g, " ")}
                </a>
              </Button>
            ))}
        </div>
      </div>
    </main>
  )
}
