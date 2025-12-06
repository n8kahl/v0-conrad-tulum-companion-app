"use client"

import { useState } from "react"
import { Maximize2, Minimize2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FlipbookViewerProps {
  url: string
  title: string
  className?: string
}

export function FlipbookViewer({ url, title, className }: FlipbookViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const openExternal = () => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div
      className={cn(
        "relative bg-muted rounded-xl overflow-hidden",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className
      )}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading {title}...</p>
          </div>
        </div>
      )}

      {/* Flipbook iframe */}
      <iframe
        src={url}
        title={title}
        className={cn(
          "w-full border-0",
          isFullscreen ? "h-screen" : "h-[70vh]",
          isLoading && "opacity-0"
        )}
        onLoad={() => setIsLoading(false)}
        allowFullScreen
        loading="lazy"
      />

      {/* Controls overlay */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={openExternal}
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

      {/* Fullscreen close hint */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFullscreen}
            className="bg-background/80 backdrop-blur-sm"
          >
            Press ESC or click to exit fullscreen
          </Button>
        </div>
      )}
    </div>
  )
}
