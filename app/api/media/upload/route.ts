import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { MediaFileType, MediaStatus } from "@/lib/supabase/types"
import { triggerProcessing } from "@/lib/media/processing"

// Maximum file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  image: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  audio: ["audio/mpeg", "audio/wav", "audio/webm", "audio/ogg"],
  pdf: ["application/pdf"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
}

function getFileType(mimeType: string): MediaFileType {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  if (mimeType === "application/pdf") return "pdf"
  return "document"
}

function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  // Check MIME type
  const fileType = getFileType(file.type)
  const allowedTypes = ALLOWED_MIME_TYPES[fileType as keyof typeof ALLOWED_MIME_TYPES]
  
  if (!allowedTypes || !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported`,
    }
  }

  return { valid: true }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const propertyId = formData.get("propertyId") as string

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Determine file type
    const fileType = getFileType(file.type)

    // Create media library record (status: uploading)
    const { data: mediaRecord, error: createError } = await supabase
      .from("media_library")
      .insert({
        property_id: propertyId,
        original_filename: file.name,
        file_type: fileType,
        mime_type: file.type,
        file_size_bytes: file.size,
        storage_path: "", // Will be updated after upload
        status: "uploading" as MediaStatus,
        uploaded_by: user.id,
        source: "upload",
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      })
      .select()
      .single()

    if (createError || !mediaRecord) {
      console.error("Error creating media record:", createError)
      return NextResponse.json(
        { error: "Failed to create media record" },
        { status: 500 }
      )
    }

    // Upload to Supabase Storage
    const storagePath = `${propertyId}/${mediaRecord.id}/${file.name}`
    const { error: uploadError } = await supabase.storage
      .from("media-library")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading to storage:", uploadError)
      
      // Update record with error
      await supabase
        .from("media_library")
        .update({
          status: "failed" as MediaStatus,
          processing_error: uploadError.message,
        })
        .eq("id", mediaRecord.id)

      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      )
    }

    // Update record with storage path and set to processing
    const { error: updateError } = await supabase
      .from("media_library")
      .update({
        storage_path: storagePath,
        status: "processing" as MediaStatus,
      })
      .eq("id", mediaRecord.id)

    if (updateError) {
      console.error("Error updating media record:", updateError)
    }

    // Trigger async processing (Edge Function)
    // This is fire-and-forget - processing happens in background
    try {
      await triggerProcessing(mediaRecord.id, fileType)
    } catch (processingError) {
      console.error("Error triggering processing:", processingError)
      // Don't fail the upload - processing can be retried
    }

    return NextResponse.json({
      mediaId: mediaRecord.id,
      status: "processing",
      message: "File uploaded successfully, processing in background",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
