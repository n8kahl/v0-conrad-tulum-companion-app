import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { triggerProcessing } from "@/lib/media/processing"

/**
 * Retry processing for a failed media item
 * GET /api/media/[id]/retry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Get media record
    const { data: media, error: fetchError } = await supabase
      .from("media_library")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !media) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      )
    }

    // Check if media is in failed state
    if (media.status !== "failed") {
      return NextResponse.json(
        { error: "Media is not in failed state" },
        { status: 400 }
      )
    }

    // Reset to processing
    const { error: updateError } = await supabase
      .from("media_library")
      .update({
        status: "processing",
        processing_error: null,
      })
      .eq("id", id)

    if (updateError) {
      console.error("Error updating media:", updateError)
      return NextResponse.json(
        { error: "Failed to update media" },
        { status: 500 }
      )
    }

    // Trigger processing again
    try {
      await triggerProcessing(id, media.file_type)
    } catch (processingError) {
      console.error("Error triggering processing:", processingError)
      return NextResponse.json(
        { error: "Failed to trigger processing" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Processing retry triggered",
    })
  } catch (error) {
    console.error("Retry error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
