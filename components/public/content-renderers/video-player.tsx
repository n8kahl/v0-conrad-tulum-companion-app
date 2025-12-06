"use client"

import { useState } from "react"
import { useLanguage } from "@/lib/contexts/language-context"
import { Button } from "@/components/ui/button"
import { ExternalLink, Maximize2, Minimize2, Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  url: string
  title: string
  thumbnailUrl?: string
  className?: string
}

/**
 * Extracts YouTube video ID from various URL formats
 */
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/v\/([^&\s?]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Extracts Vimeo video ID from URL
 */
function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Video Player component for YouTube and Vimeo embeds
 * Supports lazy loading with thumbnail preview
 */
export function VideoPlayer({ url, title, thumbnailUrl, className }: VideoPlayerProps) {
  const { t } = useLanguage()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const youtubeId = getYouTubeId(url)
  const vimeoId = getVimeoId(url)

  // Generate embed URL
  const getEmbedUrl = () => {
    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`
    }
    if (vimeoId) {
      return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`
    }
    // Fallback: try using the URL directly
    return url
  }

  // Generate thumbnail URL if not provided
  const getThumbnailUrl = () => {
    if (thumbnailUrl) return thumbnailUrl
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    }
    return null
  }

  const thumbnail = getThumbnailUrl()

  const toggleFullscreen = () => {
    const container = document.getElementById("video-container")
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

  const handlePlay = () => {
    setIsPlaying(true)
    setIsLoading(true)
  }

  return (
    <div
      id="video-container"
      className={cn(
        "relative bg-muted rounded-xl overflow-hidden group",
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "",
        className
      )}
    >
      {/* Thumbnail Preview (before playing) */}
      {!isPlaying && thumbnail && (
        <div className="relative w-full aspect-video">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* Play Button Overlay */}
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group/play"
            aria-label={`Play ${title}`}
          >
            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover/play:scale-110 transition-transform">
              <Play className="h-8 w-8 text-primary ml-1" fill="currentColor" />
            </div>
          </button>
        </div>
      )}

      {/* Video Player (after clicking play) */}
      {isPlaying && (
        <>
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Loading video...
                </p>
              </div>
            </div>
          )}

          {/* Video Iframe */}
          <iframe
            src={getEmbedUrl()}
            title={title}
            className={cn(
              "w-full border-0 aspect-video",
              isFullscreen ? "h-screen" : "",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            allowFullScreen
            loading="lazy"
            onLoad={() => setIsLoading(false)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </>
      )}

      {/* No thumbnail fallback */}
      {!isPlaying && !thumbnail && (
        <div className="relative w-full aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <button
            onClick={handlePlay}
            className="flex flex-col items-center gap-3 group/play"
            aria-label={`Play ${title}`}
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover/play:scale-110 transition-transform">
              <Play className="h-8 w-8 text-primary ml-1" fill="currentColor" />
            </div>
            <span className="text-sm text-muted-foreground">{title}</span>
          </button>
        </div>
      )}

      {/* Controls Overlay */}
      {isPlaying && (
        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
      )}

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
