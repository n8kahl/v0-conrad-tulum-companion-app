"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Camera,
  Mic,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { VisitCapture } from "@/lib/supabase/types"

interface CapturePreviewProps {
  captures: VisitCapture[]
  onRemove: (captureId: string) => void
  onPreview: (capture: VisitCapture) => void
  compact?: boolean
  className?: string
}

export function CapturePreview({
  captures,
  onRemove,
  onPreview,
  compact = false,
  className,
}: CapturePreviewProps) {
  if (captures.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("relative", className)}
    >
      {/* Count Badge */}
      <div className="absolute -top-2 -right-2 z-10 bg-[#1B4D3E] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
        {captures.length}
      </div>

      {/* Horizontal Scrolling Strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {captures.map((capture, index) => (
          <CaptureItem
            key={capture.id}
            capture={capture}
            index={index}
            compact={compact}
            onRemove={() => onRemove(capture.id)}
            onPreview={() => onPreview(capture)}
          />
        ))}
      </div>
    </motion.div>
  )
}

interface CaptureItemProps {
  capture: VisitCapture
  index: number
  compact: boolean
  onRemove: () => void
  onPreview: () => void
}

function CaptureItem({
  capture,
  index,
  compact,
  onRemove,
  onPreview,
}: CaptureItemProps) {
  const size = compact ? "w-14 h-14" : "w-20 h-20"
  const iconSize = compact ? "w-4 h-4" : "w-5 h-5"

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        size,
        "relative rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group"
      )}
      onClick={onPreview}
    >
      {capture.capture_type === "photo" ? (
        /* Photo Thumbnail */
        <>
          {capture.media?.storage_path ? (
            <img
              src={capture.media.storage_path}
              alt={capture.caption || "Captured photo"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Camera className={cn(iconSize, "text-gray-400")} />
            </div>
          )}
          <div className="absolute bottom-1 left-1 bg-black/50 rounded p-0.5">
            <Camera className="w-3 h-3 text-white" />
          </div>
        </>
      ) : (
        /* Voice Note Thumbnail */
        <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
          <Mic className={cn(iconSize, "text-white")} />
          {capture.media?.duration && (
            <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/50 px-1 rounded">
              {Math.floor(capture.media.duration / 60)}:
              {String(capture.media.duration % 60).padStart(2, "0")}
            </span>
          )}
        </div>
      )}

      {/* Remove Button (on hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3 text-white" />
      </button>
    </motion.div>
  )
}

/* Full Preview Dialog */
interface CaptureFullPreviewProps {
  captures: VisitCapture[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  onRemove: (captureId: string) => void
}

export function CaptureFullPreview({
  captures,
  initialIndex,
  isOpen,
  onClose,
  onRemove,
}: CaptureFullPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(false)

  const currentCapture = captures[currentIndex]
  if (!currentCapture) return null

  const canGoNext = currentIndex < captures.length - 1
  const canGoPrev = currentIndex > 0

  const handleNext = () => {
    if (canGoNext) {
      setCurrentIndex((i) => i + 1)
      setIsPlaying(false)
    }
  }

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentIndex((i) => i - 1)
      setIsPlaying(false)
    }
  }

  const handleRemove = () => {
    onRemove(currentCapture.id)
    if (captures.length === 1) {
      onClose()
    } else if (currentIndex >= captures.length - 1) {
      setCurrentIndex((i) => i - 1)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[80vh] p-0 bg-black border-0">
        <DialogTitle className="sr-only">Capture Preview</DialogTitle>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/10 px-4 py-2 rounded-full">
          <span className="text-white text-sm">
            {currentIndex + 1} / {captures.length}
          </span>
        </div>

        {/* Main Content */}
        <div className="relative w-full h-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCapture.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex items-center justify-center"
            >
              {currentCapture.capture_type === "photo" ? (
                /* Photo View */
                <img
                  src={currentCapture.media?.storage_path || ""}
                  alt={currentCapture.caption || "Captured photo"}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                /* Voice Note View */
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-6">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center"
                    >
                      {isPlaying ? (
                        <Pause className="w-10 h-10 text-white" />
                      ) : (
                        <Play className="w-10 h-10 text-white ml-1" />
                      )}
                    </button>
                  </div>
                  {currentCapture.transcript && (
                    <div className="max-w-md mx-auto px-6">
                      <p className="text-white/90 text-lg italic">
                        "{currentCapture.transcript}"
                      </p>
                    </div>
                  )}
                  {currentCapture.media?.duration && (
                    <p className="text-white/50 text-sm mt-4">
                      Duration: {Math.floor(currentCapture.media.duration / 60)}:
                      {String(currentCapture.media.duration % 60).padStart(2, "0")}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          {canGoPrev && (
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {canGoNext && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              {currentCapture.caption && (
                <p className="text-white font-medium">{currentCapture.caption}</p>
              )}
              <p className="text-white/50 text-sm">
                {new Date(currentCapture.captured_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
