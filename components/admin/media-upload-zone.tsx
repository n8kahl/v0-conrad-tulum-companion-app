"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, X, CheckCircle, AlertCircle, Loader2, FileIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { NewMediaFileType, MediaUploadFile, UploadState } from "@/lib/supabase/types"

// Convert file type to accept attribute value
function getAcceptString(types: NewMediaFileType[]): string {
  const acceptMap: Record<NewMediaFileType, string> = {
    image: "image/*,.jpg,.jpeg,.png,.gif,.webp,.svg",
    pdf: ".pdf,application/pdf",
    video: "video/*,.mp4,.mov,.webm",
    audio: "audio/*,.mp3,.wav,.ogg,.webm",
    document: ".pdf,.doc,.docx,.xls,.xlsx",
    floorplan: "image/*,.pdf",
    "360_tour": "image/*,video/*"
  }
  
  return types.map(t => acceptMap[t] || "").filter(Boolean).join(",")
}

interface MediaUploadZoneProps {
  propertyId: string
  onUploadComplete?: (mediaIds: string[]) => void
  allowedTypes?: NewMediaFileType[]
  maxFiles?: number
  maxSizeMB?: number
  showProcessingQueue?: boolean
  className?: string
}

export function MediaUploadZone({
  propertyId,
  onUploadComplete,
  allowedTypes = ["image", "pdf", "video", "audio"],
  maxFiles = 10,
  maxSizeMB = 100,
  showProcessingQueue = true,
  className,
}: MediaUploadZoneProps) {
  const [uploads, setUploads] = useState<MediaUploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)

      // Check max files
      if (uploads.length + fileArray.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`)
        return
      }

      // Create upload entries
      const newUploads: MediaUploadFile[] = fileArray.map((file) => ({
        file,
        id: crypto.randomUUID(),
        state: { status: "pending" },
      }))

      setUploads((prev) => [...prev, ...newUploads])

      // Process each file
      for (const upload of newUploads) {
        await processUpload(upload)
      }
    },
    [uploads.length, maxFiles, propertyId, onUploadComplete]
  )

  const processUpload = async (upload: MediaUploadFile) => {
    const { file, id } = upload

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      updateUploadState(id, {
        status: "error",
        message: `File exceeds ${maxSizeMB}MB limit`,
      })
      return
    }

    try {
      // Update to uploading
      updateUploadState(id, { status: "uploading", progress: 0 })

      // Create FormData
      const formData = new FormData()
      formData.append("file", file)
      formData.append("propertyId", propertyId)

      // Upload with progress simulation
      const uploadPromise = fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })

      // Simulate progress (real progress would need XMLHttpRequest)
      const progressInterval = setInterval(() => {
        updateUploadState(id, (prevState) => {
          if (prevState.status === "uploading") {
            const newProgress = Math.min((prevState.progress || 0) + 10, 90)
            return { status: "uploading", progress: newProgress }
          }
          return prevState
        })
      }, 200)

      const response = await uploadPromise
      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const data = await response.json()
      const mediaId = data.mediaId

      // Update to processing
      updateUploadState(id, { status: "processing", step: "Processing file..." })

      // Poll for completion
      await pollProcessingStatus(id, mediaId)
    } catch (error) {
      console.error("Upload error:", error)
      updateUploadState(id, {
        status: "error",
        message: error instanceof Error ? error.message : "Upload failed",
      })
    }
  }

  const pollProcessingStatus = async (uploadId: string, mediaId: string) => {
    const maxAttempts = 60 // 60 seconds max
    let attempts = 0

    const poll = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        updateUploadState(uploadId, {
          status: "error",
          message: "Processing timeout",
        })
        return
      }

      attempts++

      try {
        const response = await fetch(`/api/media/${mediaId}/status`)
        const data = await response.json()

        if (data.status === "ready") {
          updateUploadState(uploadId, {
            status: "complete",
            mediaId: data.id,
            thumbnail: data.thumbnail_path || "",
          })

          // Notify parent
          if (onUploadComplete) {
            onUploadComplete([mediaId])
          }
          return
        }

        if (data.status === "failed") {
          updateUploadState(uploadId, {
            status: "error",
            message: data.processing_error || "Processing failed",
          })
          return
        }

        // Still processing, poll again
        setTimeout(() => poll(), 1000)
      } catch (error) {
        console.error("Polling error:", error)
        updateUploadState(uploadId, {
          status: "error",
          message: "Failed to check status",
        })
      }
    }

    await poll()
  }

  const updateUploadState = (
    id: string,
    stateOrUpdater: UploadState | ((prev: UploadState) => UploadState)
  ) => {
    setUploads((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              state:
                typeof stateOrUpdater === "function"
                  ? stateOrUpdater(u.state)
                  : stateOrUpdater,
            }
          : u
      )
    )
  }

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id))
  }

  const clearCompleted = () => {
    setUploads((prev) => prev.filter((u) => u.state.status !== "complete"))
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFiles(files)
      }
    },
    [handleFiles]
  )

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const completedCount = uploads.filter((u) => u.state.status === "complete").length
  const hasCompleted = completedCount > 0

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary hover:bg-gray-50"
        )}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium mb-2">Drop files here</p>
        <p className="text-sm text-gray-500 mb-4">or click to browse</p>
        <p className="text-xs text-gray-400">
          Max {maxSizeMB}MB per file • {allowedTypes.join(", ")} •{" "}
          {maxFiles} files max
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          accept={getAcceptString(allowedTypes)}
        />
      </div>

      {/* Processing Queue */}
      {showProcessingQueue && uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              Processing {uploads.length > 1 ? `(${uploads.length} files)` : ""}
            </h3>
            {hasCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
              >
                Clear completed
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {uploads.map((upload) => (
              <UploadItem
                key={upload.id}
                upload={upload}
                onRemove={removeUpload}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface UploadItemProps {
  upload: MediaUploadFile
  onRemove: (id: string) => void
}

function UploadItem({ upload, onRemove }: UploadItemProps) {
  const { file, state, id } = upload

  const getIcon = () => {
    if (state.status === "complete") {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    }
    if (state.status === "error") {
      return <AlertCircle className="h-5 w-5 text-red-600" />
    }
    if (state.status === "uploading" || state.status === "processing") {
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />
    }
    return <FileIcon className="h-5 w-5 text-gray-400" />
  }

  const getStatusText = () => {
    if (state.status === "pending") return "Waiting..."
    if (state.status === "uploading") return `Uploading ${state.progress}%`
    if (state.status === "processing") return state.step || "Processing..."
    if (state.status === "complete") return "Ready"
    if (state.status === "error") return state.message
    return ""
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
      {getIcon()}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{getStatusText()}</p>

        {state.status === "uploading" && (
          <Progress value={state.progress} className="h-1 mt-2" />
        )}

        {state.status === "complete" && state.thumbnail && (
          <div className="mt-2">
            <img
              src={state.thumbnail}
              alt="Thumbnail"
              className="h-12 w-12 object-cover rounded"
            />
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(id)}
        disabled={state.status === "uploading"}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
