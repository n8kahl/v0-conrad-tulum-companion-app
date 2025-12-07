"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Mic,
  Square,
  Play,
  Pause,
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
import { useAudioRecorder, AudioRecordingResult } from "@/lib/hooks/use-audio-recorder"
import { cn } from "@/lib/utils"

interface VoiceRecorderProps {
  isOpen: boolean
  onClose: () => void
  onRecordingComplete: (result: VoiceRecordingResult) => Promise<void>
  maxDuration?: number
  venueId: string
  venueName: string
}

export interface VoiceRecordingResult {
  audioBlob: Blob
  audioUrl: string
  duration: number
  transcript?: string
  sentiment?: "positive" | "neutral" | "negative"
}

export function VoiceRecorder({
  isOpen,
  onClose,
  onRecordingComplete,
  maxDuration = 120,
  venueId,
  venueName,
}: VoiceRecorderProps) {
  const {
    isSupported,
    isRecording,
    isPaused,
    duration,
    error,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder({ maxDuration })

  const [recordedAudio, setRecordedAudio] = useState<AudioRecordingResult | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  // Create audio element for playback
  useEffect(() => {
    if (recordedAudio?.url && !audioElement) {
      const audio = new Audio(recordedAudio.url)
      audio.onended = () => setIsPlaying(false)
      setAudioElement(audio)
    }

    return () => {
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ""
      }
    }
  }, [recordedAudio?.url, audioElement])

  // Clean up when dialog closes
  useEffect(() => {
    if (!isOpen) {
      if (isRecording) {
        cancelRecording()
      }
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ""
        setAudioElement(null)
      }
      if (recordedAudio?.url) {
        URL.revokeObjectURL(recordedAudio.url)
      }
      setRecordedAudio(null)
      setIsPlaying(false)
    }
  }, [isOpen, isRecording, cancelRecording, audioElement, recordedAudio?.url])

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  const handleStartRecording = useCallback(async () => {
    await startRecording()
  }, [startRecording])

  const handleStopRecording = useCallback(async () => {
    const result = await stopRecording()
    if (result) {
      setRecordedAudio(result)
    }
  }, [stopRecording])

  const handleRetake = useCallback(() => {
    if (audioElement) {
      audioElement.pause()
      audioElement.src = ""
      setAudioElement(null)
    }
    if (recordedAudio?.url) {
      URL.revokeObjectURL(recordedAudio.url)
    }
    setRecordedAudio(null)
    setIsPlaying(false)
  }, [audioElement, recordedAudio?.url])

  const handlePlayPause = useCallback(() => {
    if (!audioElement) return

    if (isPlaying) {
      audioElement.pause()
      setIsPlaying(false)
    } else {
      audioElement.play()
      setIsPlaying(true)
    }
  }, [audioElement, isPlaying])

  const handleSave = useCallback(async () => {
    if (!recordedAudio) return

    setIsSaving(true)
    try {
      const result: VoiceRecordingResult = {
        audioBlob: recordedAudio.blob,
        audioUrl: recordedAudio.url,
        duration: recordedAudio.duration,
      }

      await onRecordingComplete(result)

      // Clean up will happen when dialog closes
      onClose()
    } catch {
      // Error handling is done by parent
    } finally {
      setIsSaving(false)
    }
  }, [recordedAudio, onRecordingComplete, onClose])

  const handleClose = useCallback(() => {
    if (isRecording) {
      cancelRecording()
    }
    onClose()
  }, [isRecording, cancelRecording, onClose])

  // Generate waveform bars based on audio level
  const waveformBars = useMemo(() => {
    const barCount = 40
    const bars = []
    for (let i = 0; i < barCount; i++) {
      const baseHeight = 0.2 + Math.random() * 0.3
      const height = isRecording
        ? Math.min(1, baseHeight + audioLevel * (0.5 + Math.random() * 0.5))
        : baseHeight
      bars.push(height)
    }
    return bars
  }, [isRecording, audioLevel])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md p-0 bg-gradient-to-b from-slate-900 to-slate-950 border-0 overflow-hidden">
        <DialogTitle className="sr-only">Voice Recorder</DialogTitle>

        {/* Header */}
        <div className="relative p-6 pb-0">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4">
              <span className="text-white/70 text-sm">Recording for</span>
              <span className="text-white font-medium">{venueName}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isSupported ? (
            <div className="text-center text-white py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="font-medium">Microphone Not Supported</p>
              <p className="text-sm text-gray-400 mt-2">
                Your device does not support audio recording.
              </p>
            </div>
          ) : error ? (
            <div className="text-center text-white py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="font-medium">Recording Error</p>
              <p className="text-sm text-gray-400 mt-2">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleStartRecording}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Timer */}
              <div className="text-center mb-8">
                <div className="text-5xl font-mono text-white tracking-wider">
                  {formatDuration(recordedAudio?.duration ?? duration)}
                </div>
                <p className="text-white/50 text-sm mt-2">
                  {isRecording
                    ? `Max ${formatDuration(maxDuration)}`
                    : recordedAudio
                      ? "Recording complete"
                      : "Tap to start recording"}
                </p>
              </div>

              {/* Waveform Visualization */}
              <div className="flex items-center justify-center gap-0.5 h-24 mb-8">
                {waveformBars.map((height, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: `${height * 100}%`,
                      opacity: isRecording ? 0.5 + height * 0.5 : 0.3,
                    }}
                    transition={{ duration: 0.1 }}
                    className={cn(
                      "w-1 rounded-full",
                      isRecording
                        ? "bg-red-500"
                        : recordedAudio
                          ? "bg-green-500"
                          : "bg-white/30"
                    )}
                  />
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6">
                <AnimatePresence mode="wait">
                  {!isRecording && !recordedAudio && (
                    /* Start Recording Button */
                    <motion.button
                      key="start"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleStartRecording}
                      className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30"
                    >
                      <Mic className="w-8 h-8 text-white" />
                    </motion.button>
                  )}

                  {isRecording && (
                    /* Stop Recording Button */
                    <motion.button
                      key="stop"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleStopRecording}
                      className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse"
                    >
                      <Square className="w-8 h-8 text-white" />
                    </motion.button>
                  )}

                  {recordedAudio && (
                    /* Playback Controls */
                    <motion.div
                      key="playback"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex items-center gap-6"
                    >
                      {/* Retake Button */}
                      <button
                        onClick={handleRetake}
                        disabled={isSaving}
                        className="flex flex-col items-center text-white disabled:opacity-50"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-1">
                          <RotateCcw className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-white/70">Retake</span>
                      </button>

                      {/* Play/Pause Button */}
                      <button
                        onClick={handlePlayPause}
                        disabled={isSaving}
                        className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center disabled:opacity-50"
                      >
                        {isPlaying ? (
                          <Pause className="w-7 h-7 text-white" />
                        ) : (
                          <Play className="w-7 h-7 text-white ml-1" />
                        )}
                      </button>

                      {/* Save Button */}
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex flex-col items-center text-white disabled:opacity-50"
                      >
                        <div className="w-14 h-14 rounded-full bg-[#1B4D3E] flex items-center justify-center mb-1">
                          {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Check className="w-5 h-5" />
                          )}
                        </div>
                        <span className="text-xs text-white/70">
                          {isSaving ? "Saving..." : "Save"}
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
