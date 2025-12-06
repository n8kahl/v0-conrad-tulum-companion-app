"use client"

import type { SiteVisit, VisitStop, Venue } from "@/lib/supabase/types"
import { useState } from "react"
import { AgendaBuilder } from "@/components/admin/agenda-builder"

interface AgendaBuilderClientProps {
  visit: SiteVisit
  initialStops: (VisitStop & { venue: Venue })[]
}

export function AgendaBuilderClient({ visit, initialStops }: AgendaBuilderClientProps) {
  const [stops, setStops] = useState(initialStops)

  return (
    <AgendaBuilder
      visit={visit}
      stops={stops}
      onUpdate={setStops}
    />
  )
}
