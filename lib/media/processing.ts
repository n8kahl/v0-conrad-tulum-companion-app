// Utility to trigger processing Edge Functions
// Can be called from the upload API route or as a standalone utility

export async function triggerProcessing(
  mediaId: string,
  fileType: string
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase configuration")
    return
  }

  // Determine which Edge Function to call
  let functionName: string
  switch (fileType) {
    case "image":
      functionName = "process-image"
      break
    case "pdf":
      functionName = "process-pdf"
      break
    case "video":
      // TODO: Implement video processing
      console.log("Video processing not yet implemented")
      return
    case "audio":
      // TODO: Implement audio processing (transcription)
      console.log("Audio processing not yet implemented")
      return
    default:
      console.log(`No processing needed for file type: ${fileType}`)
      return
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/${functionName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ mediaId }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error(`Processing failed for ${mediaId}:`, error)
      throw new Error(error.error || "Processing failed")
    }

    const result = await response.json()
    console.log(`Processing triggered for ${mediaId}:`, result)
  } catch (error) {
    console.error(`Error triggering processing for ${mediaId}:`, error)
    // Don't throw - processing will be retried or marked as failed by Edge Function
  }
}

// Alternative: Queue-based processing (recommended for production)
// This would use a service like BullMQ, Inngest, or Trigger.dev

export interface ProcessingJob {
  mediaId: string
  fileType: string
  priority?: "low" | "normal" | "high"
  retryCount?: number
}

/**
 * Queue a media processing job
 * In production, this would push to a proper queue system
 */
export async function queueProcessing(job: ProcessingJob): Promise<void> {
  // TODO: Implement with actual queue system
  // For now, just trigger directly
  await triggerProcessing(job.mediaId, job.fileType)
}

/**
 * Retry failed processing
 */
export async function retryProcessing(mediaId: string): Promise<void> {
  // TODO: Fetch media record to get file type
  // TODO: Check retry count
  // TODO: Queue with exponential backoff
  console.log(`Retry processing for ${mediaId} not yet implemented`)
}
