"use client"

import { useState, useRef, useCallback, useEffect } from "react"

export interface AudioRecordingResult {
  blob: Blob
  duration: number
  url: string
}

interface UseAudioRecorderOptions {
  maxDuration?: number // seconds
  onDataAvailable?: (data: Float32Array) => void
}

interface UseAudioRecorderReturn {
  isSupported: boolean
  isRecording: boolean
  isPaused: boolean
  duration: number
  error: string | null
  audioLevel: number
  startRecording: () => Promise<void>
  stopRecording: () => Promise<AudioRecordingResult | null>
  pauseRecording: () => void
  resumeRecording: () => void
  cancelRecording: () => void
}

export function useAudioRecorder(
  options: UseAudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const { maxDuration = 120, onDataAvailable } = options

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number>(0)

  const [isSupported, setIsSupported] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)

  // Check for support on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    const hasMediaRecorder = !!window.MediaRecorder
    const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia
    setIsSupported(hasMediaRecorder && hasGetUserMedia)
  }, [])

  // Update duration while recording
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        setDuration(elapsed)

        // Auto-stop at max duration
        if (elapsed >= maxDuration) {
          stopRecording()
        }
      }, 100)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording, isPaused, maxDuration])

  // Analyze audio levels
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isRecording) return

    const analyser = analyserRef.current
    const dataArray = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(dataArray)

    // Calculate RMS level
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i]
    }
    const rms = Math.sqrt(sum / dataArray.length)
    const level = Math.min(1, rms * 3) // Normalize and clamp

    setAudioLevel(level)
    onDataAvailable?.(dataArray)

    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }, [isRecording, onDataAvailable])

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError("Audio recording not supported on this device")
      return
    }

    setError(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      streamRef.current = stream

      // Set up Web Audio API for visualization
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/webm"

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(100) // Collect data every 100ms
      startTimeRef.current = Date.now()
      setIsRecording(true)
      setIsPaused(false)
      setDuration(0)

      // Start audio analysis
      analyzeAudio()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to access microphone"

      if (message.includes("Permission denied") || message.includes("NotAllowedError")) {
        setError("Microphone permission denied. Please allow microphone access.")
      } else if (message.includes("NotFoundError")) {
        setError("No microphone found on this device.")
      } else {
        setError(message)
      }
    }
  }, [isSupported, analyzeAudio])

  const stopRecording = useCallback(async (): Promise<AudioRecordingResult | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null)
        return
      }

      const mediaRecorder = mediaRecorderRef.current

      mediaRecorder.onstop = () => {
        // Stop audio analysis
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }

        // Close audio context
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }

        // Create blob from chunks
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        })
        const url = URL.createObjectURL(blob)
        const finalDuration = (Date.now() - startTimeRef.current) / 1000

        setIsRecording(false)
        setIsPaused(false)
        setAudioLevel(0)

        resolve({
          blob,
          duration: finalDuration,
          url,
        })
      }

      mediaRecorder.stop()
    })
  }, [isRecording])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isRecording, isPaused])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      analyzeAudio()
    }
  }, [isRecording, isPaused, analyzeAudio])

  const cancelRecording = useCallback(() => {
    // Stop audio analysis
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    chunksRef.current = []
    setIsRecording(false)
    setIsPaused(false)
    setDuration(0)
    setAudioLevel(0)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRecording()
    }
  }, [cancelRecording])

  return {
    isSupported,
    isRecording,
    isPaused,
    duration,
    error,
    audioLevel,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  }
}
