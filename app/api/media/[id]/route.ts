import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: media, error } = await supabase
      .from("media_library")
      .select("*")
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
    console.error("Error fetching media:", error)
    return NextResponse.json(
      { error: "Internal server error" },
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

    const body = await request.json()
    const { title, description, alt_text, custom_tags } = body

    // Update media metadata
    const { data: media, error: updateError } = await supabase
      .from("media_library")
      .update({
        title,
        description,
        alt_text,
        custom_tags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating media:", updateError)
      return NextResponse.json(
        { error: "Failed to update media" },
        { status: 500 }
      )
    }

    return NextResponse.json(media)
  } catch (error) {
    console.error("Error updating media:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Get media record to find storage path
    const { data: media, error: fetchError } = await supabase
      .from("media_library")
      .select("storage_path, thumbnail_path, preview_path")
      .eq("id", id)
      .single()

    if (fetchError || !media) {
      return NextResponse.json(
        { error: "Media not found" },
        { status: 404 }
      )
    }

    // Delete from storage
    const pathsToDelete = [
      media.storage_path,
      media.thumbnail_path,
      media.preview_path,
    ].filter(Boolean) as string[]

    for (const path of pathsToDelete) {
      const { error: deleteError } = await supabase.storage
        .from("media-library")
        .remove([path])

      if (deleteError) {
        console.error("Error deleting file from storage:", deleteError)
        // Continue anyway - we still want to delete the record
      }
    }

    // Delete database record (cascade will handle junction tables)
    const { error: deleteError } = await supabase
      .from("media_library")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Error deleting media record:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete media" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting media:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
