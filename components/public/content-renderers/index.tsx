"use client"

import { useLanguage } from "@/lib/contexts/language-context"
import { FlipbookViewer } from "@/components/public/flipbook-viewer"
import { VideoPlayer } from "./video-player"
import { VirtualTourViewer } from "./virtual-tour-viewer"
import { FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AssetType = "flipbook" | "video" | "virtual_tour" | "document" | "link"

interface ContentRendererProps {
  assetType: AssetType
  urls: Record<string, string> | null
  title: string
  thumbnailUrl?: string
  className?: string
}

/**
 * Unified content renderer that selects the appropriate viewer
 * based on asset type and available URLs
 */
export function ContentRenderer({
  assetType,
  urls,
  title,
  thumbnailUrl,
  className,
}: ContentRendererProps) {
  const { locale, getLocalizedUrl } = useLanguage()

  if (!urls) {
    return (
      <div className={cn("bg-muted rounded-xl p-12 flex flex-col items-center justify-center", className)}>
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground text-center">
          Content not available
        </p>
      </div>
    )
  }

  // Get the appropriate URL based on asset type
  const getContentUrl = (type: string): string | null => {
    // Try localized version first
    const localizedUrl = getLocalizedUrl(urls, type)
    if (localizedUrl) return localizedUrl

    // Fallback to direct access
    return (
      urls?.[`${type}_${locale}`] ||
      urls?.[`${type}_en`] ||
      urls?.[`${type}_es`] ||
      urls?.[type] ||
      null
    )
  }

  switch (assetType) {
    case "flipbook": {
      const flipbookUrl = getContentUrl("flipbook")
      if (flipbookUrl) {
        return (
          <FlipbookViewer
            url={flipbookUrl}
            title={title}
            className={className}
          />
        )
      }
      break
    }

    case "video": {
      const videoUrl = getContentUrl("video") || urls?.youtube || urls?.vimeo
      if (videoUrl) {
        return (
          <VideoPlayer
            url={videoUrl}
            title={title}
            thumbnailUrl={thumbnailUrl}
            className={className}
          />
        )
      }
      break
    }

    case "virtual_tour": {
      const tourUrl = getContentUrl("tour") || urls?.firstview || urls?.truetour
      if (tourUrl) {
        return (
          <VirtualTourViewer
            url={tourUrl}
            title={title}
            className={className}
          />
        )
      }
      break
    }

    case "document": {
      const pdfUrl = getContentUrl("pdf") || getContentUrl("document")
      if (pdfUrl) {
        return (
          <div className={cn("bg-muted rounded-xl p-12 flex flex-col items-center justify-center", className)}>
            <FileText className="h-16 w-16 text-primary/50 mb-6" />
            <h3 className="font-medium text-lg mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm mb-6 text-center">
              PDF document available for download
            </p>
            <Button asChild>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </a>
            </Button>
          </div>
        )
      }
      break
    }

    case "link": {
      const linkUrl = urls?.url || urls?.link || Object.values(urls)[0]
      if (linkUrl) {
        return (
          <div className={cn("bg-muted rounded-xl p-12 flex flex-col items-center justify-center", className)}>
            <FileText className="h-16 w-16 text-primary/50 mb-6" />
            <h3 className="font-medium text-lg mb-2">{title}</h3>
            <Button asChild>
              <a href={linkUrl} target="_blank" rel="noopener noreferrer">
                Open Resource
              </a>
            </Button>
          </div>
        )
      }
      break
    }
  }

  // Fallback: Show available download options
  return (
    <div className={cn("bg-muted rounded-xl p-12", className)}>
      <div className="flex flex-col items-center justify-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground text-center mb-6">
          Preview not available
        </p>
        {Object.entries(urls).length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(urls).map(([key, url]) => (
              <Button key={key} variant="outline" size="sm" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {key.replace(/_/g, " ")}
                </a>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Re-export individual viewers for direct use
export { FlipbookViewer } from "@/components/public/flipbook-viewer"
export { VideoPlayer } from "./video-player"
export { VirtualTourViewer } from "./virtual-tour-viewer"
