import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { NewMediaFileType } from "@/lib/supabase/types"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const propertyId = searchParams.get("propertyId")
    const query = searchParams.get("query")
    const fileTypes = searchParams.get("fileTypes")?.split(",") as NewMediaFileType[] | undefined
    const tags = searchParams.get("tags")?.split(",")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      )
    }

    // Build query
    let dbQuery = supabase
      .from("media_library")
      .select("*", { count: "exact" })
      .eq("property_id", propertyId)
      .eq("status", "ready")

    // Apply filters
    if (fileTypes && fileTypes.length > 0) {
      dbQuery = dbQuery.in("file_type", fileTypes)
    }

    if (tags && tags.length > 0) {
      // Match any of the provided tags
      dbQuery = dbQuery.overlaps("ai_tags", tags).overlaps("custom_tags", tags)
    }

    // Full-text search if query provided
    if (query) {
      // Use PostgreSQL full-text search
      dbQuery = dbQuery.textSearch("searchable_text", query, {
        type: "websearch",
        config: "english",
      })
    }

    // Order by creation date (newest first)
    dbQuery = dbQuery.order("created_at", { ascending: false })

    // Apply pagination
    dbQuery = dbQuery.range(offset, offset + limit - 1)

    const { data: media, error, count } = await dbQuery

    if (error) {
      console.error("Error fetching media:", error)
      return NextResponse.json(
        { error: "Failed to fetch media" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      media: media || [],
      count: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error searching media:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
