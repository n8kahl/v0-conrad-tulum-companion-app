import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // First, get the capture to find the associated media
    const { data: capture, error: fetchError } = await supabase
      .from("visit_captures")
      .select("media_id, visit_stop_id")
      .eq("id", id)
      .single()

    if (fetchError || !capture) {
      return NextResponse.json(
        { error: "Capture not found" },
        { status: 404 }
      )
    }

    // Delete the capture entry
    const { error: deleteError } = await supabase
      .from("visit_captures")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Delete capture error:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete capture" },
        { status: 500 }
      )
    }

    // Delete the associated media entry
    if (capture.media_id) {
      // First get the storage path to delete the file
      const { data: media } = await supabase
        .from("media_library")
        .select("storage_path")
        .eq("id", capture.media_id)
        .single()

      // Delete from storage if we have the path
      if (media?.storage_path) {
        const bucketName = "media-library"
        const filePath = media.storage_path.replace(`${bucketName}/`, "")
        await supabase.storage.from(bucketName).remove([filePath])
      }

      // Delete the media library entry
      await supabase
        .from("media_library")
        .delete()
        .eq("id", capture.media_id)
    }

    // Update engagement score for the visit stop
    if (capture.visit_stop_id) {
      await supabase.rpc("calculate_engagement_score", { stop_id: capture.visit_stop_id })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Capture deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete capture" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { caption, transcript, sentiment } = body

    const updateData: Record<string, unknown> = {}
    if (caption !== undefined) updateData.caption = caption
    if (transcript !== undefined) updateData.transcript = transcript
    if (sentiment !== undefined) updateData.sentiment = sentiment

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("visit_captures")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Update capture error:", error)
      return NextResponse.json(
        { error: "Failed to update capture" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Capture update error:", error)
    return NextResponse.json(
      { error: "Failed to update capture" },
      { status: 500 }
    )
  }
}
