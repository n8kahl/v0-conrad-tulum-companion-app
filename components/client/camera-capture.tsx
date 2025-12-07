"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Camera,
  SwitchCamera,
  Check,
  RotateCcw,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCamera } from "@/lib/hooks/use-camera"
import { cn } from "@/lib/utils"

interface PhotoMetadata {
  capturedAt: Date
  location?: { lat: number; lng: number }
  venueId: string
  venueName: string
}

interface CameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File, metadata: PhotoMetadata) => Promise<void>
  venueId: string
  venueName: string
  getLocation?: () => Promise<{ lat: number; lng: number } | null>
}

export function CameraCapture({
  isOpen,
  onClose,
  onCapture,
  venueId,
  venueName,
  getLocation,
}: CameraCaptureProps) {
  const {
    videoRef,
    isSupported,
    isActive,
    isLoading,
    error,
    facing,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    hasMultipleCameras,
  } = useCamera({ facing: "environment" })

  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [caption, setCaption] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Start camera when dialog opens
  useEffect(() => {
    if (isOpen && isSupported && !isActive && !isLoading) {
      startCamera()
    }
  }, [isOpen, isSupported, isActive, isLoading, startCamera])

  // Stop camera when dialog closes
  useEffect(() => {
    if (!isOpen && isActive) {
      stopCamera()
      setCapturedImage(null)
      setCapturedBlob(null)
      setCaption("")
    }
  }, [isOpen, isActive, stopCamera])

  const handleCapture = useCallback(async () => {
    const blob = await capturePhoto()
    if (blob) {
      const url = URL.createObjectURL(blob)
      setCapturedImage(url)
      setCapturedBlob(blob)
    }
  }, [capturePhoto])

  const handleRetake = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }
    setCapturedImage(null)
    setCapturedBlob(null)
    setCaption("")
  }, [capturedImage])

  const handleSave = useCallback(async () => {
    if (!capturedBlob) return

    setIsSaving(true)
    try {
      // Get location if available
      const location = getLocation ? await getLocation() : null

      // Create file from blob
      const file = new File([capturedBlob], `capture-${Date.now()}.jpg`, {
        type: "image/jpeg",
      })

      const metadata: PhotoMetadata = {
        capturedAt: new Date(),
        location: location ?? undefined,
        venueId,
        venueName,
      }

      await onCapture(file, metadata)

      // Clean up
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage)
      }
      setCapturedImage(null)
      setCapturedBlob(null)
      setCaption("")
      onClose()
    } catch {
      // Error handling is done by parent
    } finally {
      setIsSaving(false)
    }
  }, [capturedBlob, capturedImage, getLocation, venueId, venueName, onCapture, onClose])

  const handleClose = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }
    setCapturedImage(null)
    setCapturedBlob(null)
    setCaption("")
    onClose()
  }, [capturedImage, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-full h-[100dvh] p-0 bg-black border-0 sm:rounded-none">
        <DialogTitle className="sr-only">Camera Capture</DialogTitle>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Venue Name Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-white text-sm font-medium">{venueName}</span>
          </div>
        </div>

        {/* Camera Switch Button */}
        {hasMultipleCameras && !capturedImage && (
          <button
            onClick={switchCamera}
            disabled={isLoading}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors disabled:opacity-50"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>
        )}

        {/* Camera View / Preview */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {!isSupported ? (
            <div className="text-center text-white p-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="text-lg font-medium">Camera Not Supported</p>
              <p className="text-sm text-gray-400 mt-2">
                Your device does not support camera access.
              </p>
            </div>
          ) : error ? (
            <div className="text-center text-white p-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="text-lg font-medium">Camera Error</p>
              <p className="text-sm text-gray-400 mt-2">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={startCamera}
              >
                Try Again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="text-center text-white">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
              <p className="text-sm">Starting camera...</p>
            </div>
          ) : (
            <>
              {/* Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "w-full h-full object-cover",
                  capturedImage && "hidden",
                  facing === "user" && "scale-x-[-1]"
                )}
              />

              {/* Captured Image Preview */}
              <AnimatePresence>
                {capturedImage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-full object-cover"
                    />

                    {/* Caption Input */}
                    <div className="absolute bottom-28 left-4 right-4">
                      <input
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Add a caption (optional)..."
                        className="w-full px-4 py-3 bg-black/50 backdrop-blur-sm rounded-xl text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-white/50"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 pb-safe">
          <div className="p-6">
            {!capturedImage ? (
              /* Capture Button */
              <div className="flex justify-center">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCapture}
                  disabled={!isActive || isLoading}
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-50"
                >
                  <div className="w-16 h-16 rounded-full bg-white border-4 border-black/20 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-800" />
                  </div>
                </motion.button>
              </div>
            ) : (
              /* Preview Controls */
              <div className="flex items-center justify-center gap-8">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRetake}
                  disabled={isSaving}
                  className="flex flex-col items-center text-white disabled:opacity-50"
                >
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-1">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <span className="text-xs">Retake</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex flex-col items-center text-white disabled:opacity-50"
                >
                  <div className="w-14 h-14 rounded-full bg-[#1B4D3E] flex items-center justify-center mb-1">
                    {isSaving ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Check className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs">{isSaving ? "Saving..." : "Use Photo"}</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
