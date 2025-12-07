import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      visitStopId,
      captureType,
      storagePath,
      caption,
      transcript,
      sentiment,
      location,
      capturedBy = "sales",
      propertyId,
      fileName,
      fileType,
      mimeType,
      fileSize,
      dimensions,
      duration,
    } = body

    if (!visitStopId || !captureType || !storagePath) {
      return NextResponse.json(
        { error: "Missing required fields: visitStopId, captureType, storagePath" },
        { status: 400 }
      )
    }

    // First, create an entry in media_library
    const { data: mediaData, error: mediaError } = await supabase
      .from("media_library")
      .insert({
        property_id: propertyId,
        file_name: fileName || `capture-${Date.now()}`,
        file_type: fileType || (captureType === "photo" ? "image" : "audio"),
        mime_type: mimeType || (captureType === "photo" ? "image/jpeg" : "audio/webm"),
        storage_path: storagePath,
        file_size: fileSize,
        dimensions: dimensions || {},
        duration: duration,
        source: "capture",
        tags: [captureType, "tour-capture"],
      })
      .select()
      .single()

    if (mediaError) {
      console.error("Media library insert error:", mediaError)
      return NextResponse.json(
        { error: "Failed to create media entry" },
        { status: 500 }
      )
    }

    // Then, create the visit_capture entry
    const { data: captureData, error: captureError } = await supabase
      .from("visit_captures")
      .insert({
        visit_stop_id: visitStopId,
        media_id: mediaData.id,
        capture_type: captureType,
        caption,
        transcript,
        sentiment,
        location,
        captured_by: capturedBy,
        captured_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (captureError) {
      console.error("Visit capture insert error:", captureError)
      // Try to clean up the media entry
      await supabase.from("media_library").delete().eq("id", mediaData.id)
      return NextResponse.json(
        { error: "Failed to create capture entry" },
        { status: 500 }
      )
    }

    // Update engagement score for the visit stop
    await supabase.rpc("calculate_engagement_score", { stop_id: visitStopId })

    return NextResponse.json({
      id: captureData.id,
      mediaId: mediaData.id,
      createdAt: captureData.created_at,
    })
  } catch (error) {
    console.error("Capture creation error:", error)
    return NextResponse.json(
      { error: "Failed to create capture" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const visitStopId = searchParams.get("visitStopId")

    if (!visitStopId) {
      return NextResponse.json(
        { error: "visitStopId is required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("visit_captures")
      .select(`
        *,
        media:media_library(*)
      `)
      .eq("visit_stop_id", visitStopId)
      .order("captured_at", { ascending: true })

    if (error) {
      console.error("Fetch captures error:", error)
      return NextResponse.json(
        { error: "Failed to fetch captures" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Capture fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch captures" },
      { status: 500 }
    )
  }
}
