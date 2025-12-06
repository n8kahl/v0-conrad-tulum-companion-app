"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const REACTIONS = [
  { emoji: "heart", label: "Love it" },
  { emoji: "fire", label: "Amazing" },
  { emoji: "star", label: "Perfect" },
  { emoji: "thinking", label: "Considering" },
  { emoji: "ok", label: "Good" },
]

interface ReactionPickerProps {
  selectedReactions: string[]
  onReactionToggle: (reaction: string) => void
  className?: string
}

export function ReactionPicker({
  selectedReactions,
  onReactionToggle,
  className,
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const getEmojiChar = (name: string): string => {
    const emojiMap: Record<string, string> = {
      heart: "❤️",
      fire: "🔥",
      star: "⭐",
      thinking: "🤔",
      ok: "👍",
    }
    return emojiMap[name] || "👍"
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-muted-foreground hover:text-foreground",
            selectedReactions.length > 0 && "text-foreground",
            className
          )}
        >
          {selectedReactions.length > 0 ? (
            <span className="flex gap-0.5">
              {selectedReactions.slice(0, 3).map((r) => (
                <span key={r} className="text-base">
                  {getEmojiChar(r)}
                </span>
              ))}
              {selectedReactions.length > 3 && (
                <span className="text-xs ml-1">+{selectedReactions.length - 3}</span>
              )}
            </span>
          ) : (
            <span className="text-base">😊</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.emoji}
              onClick={() => onReactionToggle(reaction.emoji)}
              className={cn(
                "p-2 rounded-md hover:bg-muted transition-colors text-xl",
                selectedReactions.includes(reaction.emoji) &&
                  "bg-primary/10 ring-2 ring-primary/50"
              )}
              title={reaction.label}
            >
              {getEmojiChar(reaction.emoji)}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
