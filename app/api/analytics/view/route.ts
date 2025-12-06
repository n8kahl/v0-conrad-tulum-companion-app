import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assetId, language } = body

    if (!assetId) {
      return NextResponse.json(
        { error: "Asset ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the property ID from the asset
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("property_id")
      .eq("id", assetId)
      .single()

    if (assetError || !asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      )
    }

    // Get request headers for tracking
    const userAgent = request.headers.get("user-agent") || undefined
    const referrer = request.headers.get("referer") || undefined

    // Insert the view record
    const { error: insertError } = await supabase.from("asset_views").insert({
      asset_id: assetId,
      property_id: asset.property_id,
      language: language || "en",
      user_agent: userAgent,
      referrer: referrer,
    })

    if (insertError) {
      // Don't fail if analytics insert fails - just log it
      console.error("Error tracking asset view:", insertError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
