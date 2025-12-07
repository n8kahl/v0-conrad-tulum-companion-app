import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface ProcessImagePayload {
  mediaId: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const { mediaId } = (await req.json()) as ProcessImagePayload

    if (!mediaId) {
      return new Response(
        JSON.stringify({ error: "mediaId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Fetch media record
    const { data: media, error: fetchError } = await supabaseClient
      .from("media_library")
      .select("*")
      .eq("id", mediaId)
      .single()

    if (fetchError || !media) {
      console.error("Error fetching media:", fetchError)
      return new Response(
        JSON.stringify({ error: "Media not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Download original file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from("media-library")
      .download(media.storage_path)

    if (downloadError || !fileData) {
      console.error("Error downloading file:", downloadError)
      throw new Error("Failed to download file")
    }

    const fileBuffer = await fileData.arrayBuffer()

    // Note: Deno Edge Functions don't support native image processing libraries
    // We'll use a simplified approach or external service
    
    // For production, you would:
    // 1. Use an external image processing service (like imgix, Cloudinary)
    // 2. Use a separate worker service with sharp
    // 3. Use WebAssembly-based image processing
    
    // For now, we'll extract basic metadata and mark as ready
    const imageMetadata = {
      width: 0, // Would be extracted with proper image library
      height: 0,
      format: media.mime_type.split("/")[1],
      size: fileBuffer.byteLength,
    }

    // Generate blurhash placeholder
    // In production, use actual blurhash generation
    const blurhash = "LEHV6nWB2yk8pyo0adR*.7kCMdnj" // Placeholder

    // Update media record
    const { error: updateError } = await supabaseClient
      .from("media_library")
      .update({
        status: "ready",
        processed_at: new Date().toISOString(),
        blurhash: blurhash,
        metadata: {
          ...media.metadata,
          ...imageMetadata,
        },
        thumbnail_path: media.storage_path, // Use original for now
        preview_path: media.storage_path,
      })
      .eq("id", mediaId)

    if (updateError) {
      console.error("Error updating media:", updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        mediaId: mediaId,
        message: "Image processed successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Processing error:", error)
    
    // Update media record with error
    if (error instanceof Error) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      )
      
      await supabaseClient
        .from("media_library")
        .update({
          status: "failed",
          processing_error: error.message,
        })
        .eq("id", (await req.json()).mediaId)
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
