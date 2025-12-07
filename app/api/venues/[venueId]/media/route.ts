import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { VenueMediaContext } from "@/lib/supabase/types"

const CONTEXTS: VenueMediaContext[] = [
  "hero",
  "gallery",
  "floorplan",
  "capacity_chart",
  "setup_theater",
  "setup_banquet",
  "setup_classroom",
  "setup_reception",
  "menu",
  "av_diagram",
  "360_tour",
  "video_walkthrough",
  "previous_event",
]

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("venue_media")
    .select("*, media:media_library(*)")
    .eq("venue_id", venueId)
    .order("context")
    .order("display_order")

  if (error) {
    console.error("Error fetching venue media:", error)
    return NextResponse.json({ error: "Failed to fetch venue media" }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      mediaId,
      context,
      caption = null,
      isPrimary = false,
      displayOrder,
      showOnTour = true,
      showOnPublic = true,
    } = body

    if (!mediaId || !context) {
      return NextResponse.json(
        { error: "mediaId and context are required" },
        { status: 400 }
      )
    }

    if (!CONTEXTS.includes(context)) {
      return NextResponse.json(
        { error: "Invalid context" },
        { status: 400 }
      )
    }

    // Find next display order if not provided
    let orderValue = displayOrder ?? 0
    if (displayOrder === undefined) {
      const { data: existing } = await supabase
        .from("venue_media")
        .select("display_order")
        .eq("venue_id", venueId)
        .eq("context", context)
        .order("display_order", { ascending: false })
        .limit(1)
        .single()

      orderValue = existing?.display_order !== undefined ? existing.display_order + 1 : 0
    }

    // Ensure only one primary per venue/context
    if (isPrimary) {
      await supabase
        .from("venue_media")
        .update({ is_primary: false })
        .eq("venue_id", venueId)
        .eq("context", context)
    }

    const { data, error } = await supabase
      .from("venue_media")
      .insert({
        venue_id: venueId,
        media_id: mediaId,
        context,
        caption,
        display_order: orderValue,
        is_primary: isPrimary,
        show_on_tour: showOnTour,
        show_on_public: showOnPublic,
      })
      .select("*, media:media_library(*)")
      .single()

    if (error) {
      console.error("Error linking media to venue:", error)
      return NextResponse.json({ error: "Failed to link media" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Venue media POST error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
