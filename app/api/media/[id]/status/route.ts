import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Lightweight endpoint for polling processing status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: media, error } = await supabase
      .from("media_library")
      .select("id, status, processed_at, processing_error, thumbnail_path")
      .eq("id", id)
      .single()

    if (error || !media) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(media)
  } catch (error) {
    console.error("Error fetching media status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
