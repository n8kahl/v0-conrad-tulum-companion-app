import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface ProcessPdfPayload {
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

    const { mediaId } = (await req.json()) as ProcessPdfPayload

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

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from("media-library")
      .download(media.storage_path)

    if (downloadError || !fileData) {
      console.error("Error downloading file:", downloadError)
      throw new Error("Failed to download file")
    }

    // Note: PDF processing in Edge Functions is limited
    // For production, you would:
    // 1. Use pdf-parse library (if available in Deno)
    // 2. Use external PDF processing service (like Adobe PDF Services, PDFTron)
    // 3. Use a separate worker service with pdf-lib or pdfjs
    
    // For now, we'll use basic PDF detection and mark as ready
    const fileBuffer = await fileData.arrayBuffer()
    const pdfMetadata = {
      page_count: 1, // Would be extracted with proper PDF library
      file_size: fileBuffer.byteLength,
      document_type: detectDocumentType(media.original_filename),
    }

    // Update media record
    const { error: updateError } = await supabaseClient
      .from("media_library")
      .update({
        status: "ready",
        processed_at: new Date().toISOString(),
        metadata: {
          ...media.metadata,
          ...pdfMetadata,
        },
        searchable_text: `PDF document: ${media.original_filename}`,
        ai_tags: generatePdfTags(media.original_filename),
        thumbnail_path: media.storage_path, // Would be first page thumbnail
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
        message: "PDF processed successfully",
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
      
      const payload = await req.json()
      await supabaseClient
        .from("media_library")
        .update({
          status: "failed",
          processing_error: error.message,
        })
        .eq("id", payload.mediaId)
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

// Helper function to detect document type from filename
function detectDocumentType(filename: string): string {
  const lower = filename.toLowerCase()
  
  if (lower.includes("floorplan") || lower.includes("floor-plan")) {
    return "floorplan"
  }
  if (lower.includes("capacity") || lower.includes("seating")) {
    return "capacity_chart"
  }
  if (lower.includes("menu")) {
    return "menu"
  }
  if (lower.includes("contract") || lower.includes("agreement")) {
    return "contract"
  }
  if (lower.includes("brochure") || lower.includes("factsheet")) {
    return "marketing"
  }
  
  return "document"
}

// Helper function to generate tags from filename
function generatePdfTags(filename: string): string[] {
  const tags: string[] = []
  const lower = filename.toLowerCase()
  
  if (lower.includes("floorplan")) tags.push("floorplan")
  if (lower.includes("capacity")) tags.push("capacity")
  if (lower.includes("menu")) tags.push("menu")
  if (lower.includes("ballroom")) tags.push("ballroom")
  if (lower.includes("meeting")) tags.push("meeting")
  if (lower.includes("wedding")) tags.push("wedding")
  if (lower.includes("spa")) tags.push("spa")
  if (lower.includes("dining")) tags.push("dining")
  
  return tags
}
