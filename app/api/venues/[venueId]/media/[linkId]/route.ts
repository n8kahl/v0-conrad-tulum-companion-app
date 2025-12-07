import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string; linkId: string }> }
) {
  try {
    const { venueId, linkId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.caption !== undefined) updates.caption = body.caption
    if (body.context) updates.context = body.context
    if (body.displayOrder !== undefined) updates.display_order = body.displayOrder
    if (body.showOnTour !== undefined) updates.show_on_tour = body.showOnTour
    if (body.showOnPublic !== undefined) updates.show_on_public = body.showOnPublic

    if (body.isPrimary === true) {
      // Clear existing primary for this venue/context
      const { data: current } = await supabase
        .from("venue_media")
        .select("context")
        .eq("id", linkId)
        .single()

      const context = current?.context
      if (context) {
        await supabase
          .from("venue_media")
          .update({ is_primary: false })
          .eq("venue_id", venueId)
          .eq("context", context)
      }
      updates.is_primary = true
    } else if (body.isPrimary === false) {
      updates.is_primary = false
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("venue_media")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", linkId)
      .select("*, media:media_library(*)")
      .single()

    if (error) {
      console.error("Error updating venue media:", error)
      return NextResponse.json({ error: "Failed to update venue media" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Venue media PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ venueId: string; linkId: string }> }
) {
  try {
    const { linkId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("venue_media")
      .delete()
      .eq("id", linkId)

    if (error) {
      console.error("Error deleting venue media:", error)
      return NextResponse.json({ error: "Failed to delete venue media" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Venue media DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
