import { NextRequest, NextResponse } from "next/server"

// Simple sentiment analysis based on keywords
function analyzeSentiment(text: string): "positive" | "neutral" | "negative" {
  const lowerText = text.toLowerCase()

  const positiveWords = [
    "love", "amazing", "beautiful", "perfect", "excellent", "wonderful",
    "great", "fantastic", "stunning", "gorgeous", "impressed", "incredible",
    "awesome", "best", "favorite", "lovely", "definitely", "absolutely",
    "wow", "excited", "delighted", "thrilled", "happy", "pleased"
  ]

  const negativeWords = [
    "bad", "terrible", "awful", "horrible", "hate", "disappointed",
    "concern", "worried", "issue", "problem", "small", "tight", "cramped",
    "expensive", "loud", "noisy", "dirty", "old", "dated", "poor", "lacking"
  ]

  let positiveCount = 0
  let negativeCount = 0

  for (const word of positiveWords) {
    if (lowerText.includes(word)) positiveCount++
  }

  for (const word of negativeWords) {
    if (lowerText.includes(word)) negativeCount++
  }

  if (positiveCount > negativeCount + 1) return "positive"
  if (negativeCount > positiveCount + 1) return "negative"
  return "neutral"
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File | null
    const language = (formData.get("language") as string) || "en"

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      // Return a placeholder response when no API key is configured
      // In production, you'd want to handle this differently
      return NextResponse.json({
        transcript: "[Voice note recorded - transcription not configured]",
        duration: 0,
        language,
        sentiment: "neutral" as const,
      })
    }

    // Convert File to ArrayBuffer for OpenAI API
    const audioBuffer = await audioFile.arrayBuffer()

    // Call OpenAI Whisper API
    const whisperFormData = new FormData()
    whisperFormData.append("file", new Blob([audioBuffer], { type: audioFile.type }), audioFile.name)
    whisperFormData.append("model", "whisper-1")
    whisperFormData.append("language", language === "es" ? "es" : "en")

    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: whisperFormData,
    })

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.json().catch(() => ({}))
      console.error("Whisper API error:", errorData)

      // Return placeholder on API error
      return NextResponse.json({
        transcript: "[Transcription temporarily unavailable]",
        duration: 0,
        language,
        sentiment: "neutral" as const,
      })
    }

    const whisperResult = await whisperResponse.json()
    const transcript = whisperResult.text || ""

    // Analyze sentiment
    const sentiment = analyzeSentiment(transcript)

    return NextResponse.json({
      transcript,
      duration: whisperResult.duration || 0,
      language,
      sentiment,
    })
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    )
  }
}
