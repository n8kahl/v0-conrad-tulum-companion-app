"use client"

import { useState } from "react"
import { useLanguage } from "@/lib/contexts/language-context"
import { Button } from "@/components/ui/button"
import { ExternalLink, Maximize2, Minimize2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface VirtualTourViewerProps {
  url: string
  title: string
  className?: string
}

/**
 * Virtual Tour Viewer for FirstView/TrueTour 360 experiences
 * Supports iframe embedding with fullscreen and controls
 */
export function VirtualTourViewer({ url, title, className }: VirtualTourViewerProps) {
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    const container = document.getElementById("tour-container")
    if (!container) return

    if (!isFullscreen) {
      container.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  const handleOpenExternal = () => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleReload = () => {
    setIsLoading(true)
    const iframe = document.querySelector("#tour-iframe") as HTMLIFrameElement
    if (iframe) {
      iframe.src = url
    }
  }

  return (
    <div
      id="tour-container"
      className={cn(
        "relative bg-muted rounded-xl overflow-hidden",
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "",
        className
      )}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading {title}...
            </p>
          </div>
        </div>
      )}

      {/* Virtual Tour Iframe */}
      <iframe
        id="tour-iframe"
        src={url}
        title={title}
        className={cn(
          "w-full border-0",
          isFullscreen ? "h-screen" : "h-[70vh]",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        allowFullScreen
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking"
      />

      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleReload}
          className="bg-background/80 backdrop-blur-sm hover:bg-background"
          title="Reload tour"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleOpenExternal}
          className="bg-background/80 backdrop-blur-sm hover:bg-background"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleFullscreen}
          className="bg-background/80 backdrop-blur-sm hover:bg-background"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Button
            variant="secondary"
            onClick={toggleFullscreen}
            className="bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Exit Fullscreen
          </Button>
        </div>
      )}
    </div>
  )
}
