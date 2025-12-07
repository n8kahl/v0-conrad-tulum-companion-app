"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Move,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface ImmersiveViewerProps {
  imageUrl: string
  title: string
  description?: string
  className?: string
}

export function ImmersiveViewer({
  imageUrl,
  title,
  description,
  className,
}: ImmersiveViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const positionStartRef = useRef({ x: 0, y: 0 })

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.25, 1))
  }, [])

  const handleReset = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX, y: e.clientY }
      positionStartRef.current = position
    },
    [scale, position]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || scale <= 1) return
      const deltaX = e.clientX - dragStartRef.current.x
      const deltaY = e.clientY - dragStartRef.current.y
      setPosition({
        x: positionStartRef.current.x + deltaX,
        y: positionStartRef.current.y + deltaY,
      })
    },
    [isDragging, scale]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      setScale((s) => Math.min(s + 0.1, 3))
    } else {
      setScale((s) => {
        const newScale = Math.max(s - 0.1, 1)
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 })
        }
        return newScale
      })
    }
  }, [])

  const ImageViewer = ({ isDialog = false }: { isDialog?: boolean }) => (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-black/95",
        isDialog ? "w-full h-full" : "aspect-[16/10] rounded-xl",
        scale > 1 && "cursor-grab",
        isDragging && "cursor-grabbing"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{
          scale,
          x: position.x,
          y: position.y,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-contain select-none"
          draggable={false}
          priority
        />
      </motion.div>

      {/* Title overlay */}
      {!isDialog && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <h2 className="font-serif text-white text-xl md:text-2xl font-light">
            {title}
          </h2>
          {description && (
            <p className="text-white/70 text-sm mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {scale > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white/70 text-xs"
          >
            <Move className="h-3 w-3" />
            <span>Drag to pan</span>
          </motion.div>
        )}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-black/60 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-white/70 text-xs min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          {scale > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
        {!isDialog && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(true)}
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-black/60 backdrop-blur-sm"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <>
      <div className={className}>
        <ImageViewer />
      </div>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 border-0 bg-black/95 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>{title} - Immersive View</DialogTitle>
          </VisuallyHidden>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 left-4 z-50 h-10 w-10 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Title in fullscreen */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 text-center">
            <h2 className="font-serif text-white text-xl font-light">
              {title}
            </h2>
            {description && (
              <p className="text-white/60 text-sm mt-1">{description}</p>
            )}
          </div>

          {/* Minimize button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(false)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-white/70 hover:text-white hover:bg-white/10 gap-2"
          >
            <Minimize2 className="h-4 w-4" />
            Exit Fullscreen
          </Button>

          <div className="w-full h-full pt-16 pb-16">
            <ImageViewer isDialog />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
