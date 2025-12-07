import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: property, error } = await supabase
      .from("properties")
      .select("branding_config, brand_colors")
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch branding configuration" },
        { status: 500 }
      )
    }

    // Merge branding_config with brand_colors for colors
    const config = {
      ...property.branding_config,
      colors: property.brand_colors || property.branding_config?.colors
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error fetching branding:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { branding_config, brand_colors } = body

    // Get current property
    const { data: property, error: fetchError } = await supabase
      .from("properties")
      .select("id")
      .single()

    if (fetchError || !property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      )
    }

    // Update branding configuration
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    if (branding_config) {
      updates.branding_config = branding_config
    }

    if (brand_colors) {
      updates.brand_colors = brand_colors
    }

    const { error: updateError } = await supabase
      .from("properties")
      .update(updates)
      .eq("id", property.id)

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update branding configuration" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating branding:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
