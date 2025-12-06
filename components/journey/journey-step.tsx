"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface JourneyStepProps {
  icon: LucideIcon
  title: string
  description: string
  duration?: string
  isActive?: boolean
  isCompleted?: boolean
  index: number
  isLast?: boolean
}

export function JourneyStep({
  icon: Icon,
  title,
  description,
  duration,
  isActive = false,
  isCompleted = false,
  index,
  isLast = false,
}: JourneyStepProps) {
  return (
    <div className="relative flex gap-4">
      {/* Vertical line */}
      {!isLast && (
        <div
          className={cn(
            "absolute left-5 top-12 w-0.5 h-[calc(100%-24px)]",
            isCompleted ? "bg-primary" : "bg-border"
          )}
        />
      )}

      {/* Icon circle */}
      <div
        className={cn(
          "relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          isActive
            ? "bg-primary border-primary text-primary-foreground"
            : isCompleted
              ? "bg-primary/10 border-primary text-primary"
              : "bg-background border-border text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4
              className={cn(
                "font-medium",
                isActive ? "text-primary" : "text-foreground"
              )}
            >
              {title}
            </h4>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
          {duration && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full flex-shrink-0">
              {duration}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
