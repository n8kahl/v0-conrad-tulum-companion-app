"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export type CameraFacing = "user" | "environment"

interface UseCameraOptions {
  facing?: CameraFacing
  width?: number
  height?: number
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isSupported: boolean
  isActive: boolean
  isLoading: boolean
  error: string | null
  facing: CameraFacing
  startCamera: () => Promise<void>
  stopCamera: () => void
  switchCamera: () => Promise<void>
  capturePhoto: () => Promise<Blob | null>
  hasMultipleCameras: boolean
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { facing: initialFacing = "environment", width = 1920, height = 1080 } = options

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [isSupported, setIsSupported] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facing, setFacing] = useState<CameraFacing>(initialFacing)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  // Check for camera support on mount
  useEffect(() => {
    const checkSupport = async () => {
      if (typeof window === "undefined") return

      const hasMediaDevices = !!navigator.mediaDevices?.getUserMedia
      setIsSupported(hasMediaDevices)

      if (hasMediaDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoDevices = devices.filter((d) => d.kind === "videoinput")
          setHasMultipleCameras(videoDevices.length > 1)
        } catch {
          // Ignore enumeration errors
        }
      }
    }

    checkSupport()
  }, [])

  // Create canvas for photo capture
  useEffect(() => {
    if (typeof document !== "undefined" && !canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
    }
  }, [])

  const startCamera = useCallback(async () => {
    if (!isSupported) {
      setError("Camera not supported on this device")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setIsActive(true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to access camera"

      if (message.includes("Permission denied") || message.includes("NotAllowedError")) {
        setError("Camera permission denied. Please allow camera access.")
      } else if (message.includes("NotFoundError")) {
        setError("No camera found on this device.")
      } else {
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, facing, width, height])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsActive(false)
  }, [])

  const switchCamera = useCallback(async () => {
    const newFacing = facing === "user" ? "environment" : "user"
    setFacing(newFacing)

    if (isActive) {
      stopCamera()
      // Small delay to ensure previous stream is fully stopped
      await new Promise((resolve) => setTimeout(resolve, 100))
      await startCamera()
    }
  }, [facing, isActive, stopCamera, startCamera])

  const capturePhoto = useCallback(async (): Promise<Blob | null> => {
    if (!videoRef.current || !canvasRef.current || !isActive) {
      return null
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    // Mirror image if using front camera
    if (facing === "user") {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(video, 0, 0)

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.92 // High quality JPEG
      )
    })
  }, [isActive, facing])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return {
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
  }
}
