"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, X, Loader2, Image as ImageIcon, ExternalLink, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadFieldProps {
  /**
   * Current image URL (if any)
   */
  value?: string
  
  /**
   * Callback when image is uploaded successfully
   * Returns mediaId and storage URL
   */
  onUpload: (mediaId: string, url: string) => void
  
  /**
   * Callback when image is removed
   */
  onRemove?: () => void
  
  /**
   * Optional label for the field
   */
  label?: string
  
  /**
   * Optional help text
   */
  helpText?: string
  
  /**
   * Property ID for organizing uploads
   */
  propertyId: string
  
  /**
   * Aspect ratio hint for preview (e.g., "16/9", "4/3", "1/1")
   */
  aspectRatio?: string
  
  /**
   * Maximum file size in MB
   */
  maxSizeMB?: number
  
  /**
   * Allow manual URL entry alongside upload
   */
  allowUrlEntry?: boolean
  
  /**
   * Optional className for container
   */
  className?: string
  
  /**
   * Compact mode (smaller preview)
   */
  compact?: boolean
  
  /**
   * Required field indicator
   */
  required?: boolean
}

export function ImageUploadField({
  value,
  onUpload,
  onRemove,
  label,
  helpText,
  propertyId,
  aspectRatio = "16/9",
  maxSizeMB = 10,
  allowUrlEntry = true,
  className,
  compact = false,
  required = false,
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [dragActive, setDragActive] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState(value || "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      alert(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    // Create local preview
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Upload to server
      const formData = new FormData()
      formData.append("file", file)
      formData.append("propertyId", propertyId)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 15, 90))
      }, 300)

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(95)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const data = await response.json()
      const mediaId = data.mediaId

      // Poll for processing completion
      let attempts = 0
      const maxAttempts = 60 // 60 seconds max
      
      while (attempts < maxAttempts) {
        const statusResponse = await fetch(`/api/media/${mediaId}/status`)
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          
          if (statusData.status === "ready") {
            // Get the public URL
            const publicUrlResponse = await fetch(`/api/media/${mediaId}/url`)
            const urlData = await publicUrlResponse.json()
            const imageUrl = urlData.url
            
            setUploadProgress(100)
            setPreview(imageUrl)
            onUpload(mediaId, imageUrl)
            break
          } else if (statusData.status === "failed") {
            throw new Error("Processing failed")
          }
        }
        
        attempts++
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      
      if (attempts >= maxAttempts) {
        throw new Error("Processing timeout")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert(error instanceof Error ? error.message : "Failed to upload image")
      setPreview(value || null)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [propertyId, maxSizeMB, value, onUpload])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setPreview(null)
    setUrlInput("")
    if (onRemove) {
      onRemove()
    } else {
      onUpload("", "")
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setPreview(urlInput)
      onUpload("", urlInput) // No mediaId for manual URLs
      setShowUrlInput(false)
    }
  }

  const previewHeight = compact ? "h-24" : "h-40"
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      {preview ? (
        // Preview mode with image
        <div className="relative group rounded-lg overflow-hidden border border-border">
          <div className={cn("relative w-full", previewHeight)}
               style={{ aspectRatio: aspectRatio }}>
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
              <div className="w-3/4 bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-full rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-white mt-2">{uploadProgress}%</p>
            </div>
          )}
          
          {!isUploading && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClick}
              >
                <Upload className="h-4 w-4 mr-2" />
                Change
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Upload prompt
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-border",
            isUploading && "opacity-60 pointer-events-none"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className={cn(
              "w-full flex flex-col items-center justify-center gap-2 p-6 cursor-pointer hover:bg-muted/50 transition-colors rounded-lg",
              previewHeight
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-primary/10 p-3">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WEBP up to {maxSizeMB}MB
                  </p>
                </div>
              </>
            )}
          </button>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
        }}
        className="hidden"
        disabled={isUploading}
      />
      
      {allowUrlEntry && (
        <div className="space-y-2">
          {!showUrlInput ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowUrlInput(true)}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Or enter URL manually
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://... or /path/to/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleUrlSubmit()
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowUrlInput(false)
                  setUrlInput(value || "")
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
      
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  )
}
