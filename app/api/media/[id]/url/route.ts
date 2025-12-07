import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get media storage path
    const { data: media, error } = await supabase
      .from("media_library")
      .select("storage_path, thumbnail_path")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching media:", error)
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      )
    }

    // Generate public URL from Supabase Storage
    const { data: urlData } = supabase.storage
      .from("media-library")
      .getPublicUrl(media.storage_path)

    return NextResponse.json({
      url: urlData.publicUrl,
      thumbnailUrl: media.thumbnail_path
        ? supabase.storage.from("media-library").getPublicUrl(media.thumbnail_path).data.publicUrl
        : null,
    })
  } catch (error) {
    console.error("Error in media URL route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
