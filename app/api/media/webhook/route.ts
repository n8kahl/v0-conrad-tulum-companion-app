import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Webhook endpoint for processing completion
 * Called by Edge Functions when processing completes
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify request is from Supabase (check authorization)
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { mediaId, status, error: processingError, metadata } = body

    if (!mediaId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Update media record
    const updateData: {
      status: string
      processed_at?: string
      processing_error?: string
      metadata?: unknown
    } = {
      status,
    }

    if (status === "ready") {
      updateData.processed_at = new Date().toISOString()
      if (metadata) {
        updateData.metadata = metadata
      }
    }

    if (status === "failed" && processingError) {
      updateData.processing_error = processingError
    }

    const { error: updateError } = await supabase
      .from("media_library")
      .update(updateData)
      .eq("id", mediaId)

    if (updateError) {
      console.error("Error updating media:", updateError)
      return NextResponse.json(
        { error: "Failed to update media" },
        { status: 500 }
      )
    }

    // TODO: Trigger any post-processing actions
    // - Send notification to user
    // - Trigger further processing (e.g., AI tagging)
    // - Update related records

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
