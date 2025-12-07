import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Anthropic from "@anthropic-ai/sdk"

interface VenueHighlight {
  venueId: string
  venueName: string
  sentiment: "positive" | "neutral" | "negative"
  keyPoints: string[]
  clientQuotes: string[]
}

interface GeneratedRecap {
  executiveSummary: string
  venueHighlights: VenueHighlight[]
  recommendedNextSteps: string[]
  proposalTalkingPoints: string[]
  concerns: string[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { visitId } = await request.json()

    if (!visitId) {
      return NextResponse.json(
        { error: "visitId is required" },
        { status: 400 }
      )
    }

    // Fetch visit data
    const { data: visit, error: visitError } = await supabase
      .from("site_visits")
      .select("*")
      .eq("id", visitId)
      .single()

    if (visitError || !visit) {
      return NextResponse.json(
        { error: "Visit not found" },
        { status: 404 }
      )
    }

    // Fetch visit stops with venues
    const { data: stops, error: stopsError } = await supabase
      .from("visit_stops")
      .select(`
        *,
        venue:venues(*)
      `)
      .eq("site_visit_id", visitId)
      .order("order_index", { ascending: true })

    if (stopsError) {
      return NextResponse.json(
        { error: "Failed to fetch visit stops" },
        { status: 500 }
      )
    }

    // Fetch captures for all stops
    const stopIds = stops?.map((s) => s.id) || []
    const { data: captures } = await supabase
      .from("visit_captures")
      .select("*")
      .in("visit_stop_id", stopIds)

    // Fetch annotations for all stops
    const { data: annotations } = await supabase
      .from("visit_annotations")
      .select("*")
      .in("visit_stop_id", stopIds)

    // Prepare data for AI
    const visitContext = {
      clientCompany: visit.client_company,
      clientContact: visit.client_contact,
      groupType: visit.group_type,
      estimatedAttendees: visit.estimated_attendees,
      preferredDates: visit.preferred_dates,
      visitDate: visit.visit_date,
    }

    const venueData = stops?.map((stop) => ({
      venueName: stop.venue?.name || "Unknown Venue",
      venueType: stop.venue?.venue_type || "unknown",
      capacities: stop.venue?.capacities || {},
      features: stop.venue?.features || [],
      isFavorited: stop.client_favorited,
      salesNotes: stop.sales_notes,
      clientReaction: stop.client_reaction,
      timeSpent: stop.time_spent_seconds,
      captures: captures?.filter((c) => c.visit_stop_id === stop.id) || [],
      annotations: annotations?.filter((a) => a.visit_stop_id === stop.id) || [],
    }))

    // Compile voice note transcripts
    const voiceTranscripts = captures
      ?.filter((c) => c.capture_type === "voice_note" && c.transcript)
      .map((c) => ({
        venue: stops?.find((s) => s.id === c.visit_stop_id)?.venue?.name || "Unknown",
        transcript: c.transcript,
        sentiment: c.sentiment,
      }))

    // Check for Anthropic API key
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY

    let recap: GeneratedRecap

    if (anthropicApiKey) {
      // Generate with Claude
      recap = await generateWithClaude(
        anthropicApiKey,
        visitContext,
        venueData || [],
        voiceTranscripts || []
      )
    } else {
      // Generate fallback recap without AI
      recap = generateFallbackRecap(visitContext, venueData || [], stops || [])
    }

    // Save recap draft to database
    const { data: existingDraft } = await supabase
      .from("recap_drafts")
      .select("version")
      .eq("site_visit_id", visitId)
      .order("version", { ascending: false })
      .limit(1)
      .single()

    const nextVersion = existingDraft ? existingDraft.version + 1 : 1

    const { data: savedDraft, error: saveError } = await supabase
      .from("recap_drafts")
      .insert({
        site_visit_id: visitId,
        version: nextVersion,
        ai_summary: recap.executiveSummary,
        key_highlights: recap.venueHighlights,
        recommended_next_steps: recap.recommendedNextSteps,
        proposal_talking_points: recap.proposalTalkingPoints,
        concerns: recap.concerns,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (saveError) {
      console.error("Failed to save recap draft:", saveError)
    }

    return NextResponse.json({
      recap,
      draftId: savedDraft?.id,
      version: nextVersion,
    })
  } catch (error) {
    console.error("Recap generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate recap" },
      { status: 500 }
    )
  }
}

async function generateWithClaude(
  apiKey: string,
  visitContext: Record<string, unknown>,
  venueData: Array<Record<string, unknown>>,
  voiceTranscripts: Array<{ venue: string; transcript: string | null; sentiment: string | null }>
): Promise<GeneratedRecap> {
  const client = new Anthropic({ apiKey })

  const prompt = `You are a luxury hotel sales assistant helping create a post-visit recap for a meeting planner who toured Conrad Tulum.

## Visit Information
- Client Company: ${visitContext.clientCompany}
- Contact: ${JSON.stringify(visitContext.clientContact)}
- Group Type: ${visitContext.groupType}
- Estimated Attendees: ${visitContext.estimatedAttendees}
- Visit Date: ${visitContext.visitDate}

## Venues Visited
${venueData.map((v, i) => `
### ${i + 1}. ${v.venueName} (${v.venueType})
- Favorited: ${v.isFavorited ? "Yes" : "No"}
- Capacities: ${JSON.stringify(v.capacities)}
- Features: ${(v.features as string[])?.join(", ") || "None listed"}
- Sales Notes: ${v.salesNotes || "None"}
- Client Reaction: ${v.clientReaction || "None recorded"}
- Time Spent: ${v.timeSpent ? `${Math.round((v.timeSpent as number) / 60)} minutes` : "Unknown"}
`).join("\n")}

## Voice Note Transcripts
${voiceTranscripts.length > 0
  ? voiceTranscripts.map((t) => `- At ${t.venue}: "${t.transcript}" (Sentiment: ${t.sentiment || "neutral"})`).join("\n")
  : "No voice notes recorded"}

---

Please generate a comprehensive recap in the following JSON format:

{
  "executiveSummary": "2-3 paragraphs summarizing the visit, client interests, and overall impression",
  "venueHighlights": [
    {
      "venueId": "venue identifier",
      "venueName": "venue name",
      "sentiment": "positive|neutral|negative",
      "keyPoints": ["key point 1", "key point 2"],
      "clientQuotes": ["any direct quotes or paraphrased feedback"]
    }
  ],
  "recommendedNextSteps": ["specific action item 1", "action item 2"],
  "proposalTalkingPoints": ["point to emphasize in proposal", "unique selling point"],
  "concerns": ["any concerns or hesitations expressed by client"]
}

Focus on:
1. Highlighting favorited venues prominently
2. Extracting specific client feedback and quotes
3. Suggesting concrete next steps
4. Identifying any concerns to address proactively

Respond with ONLY the JSON object, no markdown formatting.`

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  })

  // Extract text content
  const textContent = response.content.find((c) => c.type === "text")
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude")
  }

  // Parse JSON response
  try {
    const parsed = JSON.parse(textContent.text)
    return parsed as GeneratedRecap
  } catch {
    console.error("Failed to parse Claude response:", textContent.text)
    throw new Error("Invalid JSON response from Claude")
  }
}

function generateFallbackRecap(
  visitContext: Record<string, unknown>,
  venueData: Array<Record<string, unknown>>,
  stops: Array<{ client_favorited: boolean; venue?: { name: string; id: string } | null }>
): GeneratedRecap {
  const favoritedVenues = stops.filter((s) => s.client_favorited)
  const venueNames = venueData.map((v) => v.venueName as string)

  return {
    executiveSummary: `Thank you for visiting Conrad Tulum! During your site tour, you explored ${venueData.length} venues ideal for your ${visitContext.groupType} event with approximately ${visitContext.estimatedAttendees} attendees.

${favoritedVenues.length > 0
  ? `You showed particular interest in ${favoritedVenues.map((v) => v.venue?.name).join(", ")}, which would be excellent choices for your program.`
  : `Our venues including ${venueNames.slice(0, 3).join(", ")} offer versatile spaces for your event needs.`}

We look forward to helping you create an unforgettable experience at Conrad Tulum.`,

    venueHighlights: venueData.map((v) => ({
      venueId: v.venueId as string || "",
      venueName: v.venueName as string,
      sentiment: v.isFavorited ? "positive" as const : "neutral" as const,
      keyPoints: [
        `Capacity for ${JSON.stringify(v.capacities)}`,
        ...(v.salesNotes ? [`Sales note: ${v.salesNotes}`] : []),
      ],
      clientQuotes: v.clientReaction ? [v.clientReaction as string] : [],
    })),

    recommendedNextSteps: [
      "Send customized proposal based on venue preferences",
      "Confirm preferred dates and room block requirements",
      "Schedule follow-up call to discuss catering options",
      "Provide detailed AV and production capabilities",
    ],

    proposalTalkingPoints: [
      "Highlight favorited venue capabilities",
      "Emphasize Conrad Tulum's luxury amenities",
      "Include group dining options at specialty restaurants",
      "Feature wellness and team-building activities",
    ],

    concerns: [],
  }
}

// GET endpoint to fetch existing recap
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const visitId = searchParams.get("visitId")

    if (!visitId) {
      return NextResponse.json(
        { error: "visitId is required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("recap_drafts")
      .select("*")
      .eq("site_visit_id", visitId)
      .order("version", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ recap: null })
      }
      throw error
    }

    return NextResponse.json({
      recap: {
        executiveSummary: data.ai_summary,
        venueHighlights: data.key_highlights,
        recommendedNextSteps: data.recommended_next_steps,
        proposalTalkingPoints: data.proposal_talking_points,
        concerns: data.concerns,
      },
      draftId: data.id,
      version: data.version,
      approved: data.approved,
      generatedAt: data.generated_at,
    })
  } catch (error) {
    console.error("Fetch recap error:", error)
    return NextResponse.json(
      { error: "Failed to fetch recap" },
      { status: 500 }
    )
  }
}
