"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, Mic, MessageSquare, Smile, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface CaptureResult {
  type: "photo" | "voice_note" | "reaction" | "note"
  mediaId?: string
  content?: string
  emoji?: string
  transcript?: string
  blob?: Blob
}

interface CaptureToolbarProps {
  visitStopId: string
  venueId: string
  venueName: string
  onCaptureStart: (type: CaptureResult["type"]) => void
  onReaction?: (emoji: string) => void
  onNote?: (content: string) => void
  disabled?: boolean
  className?: string
}

const QUICK_REACTIONS = ["❤️", "🔥", "⭐", "👍", "🤔", "📍"]

export function CaptureToolbar({
  visitStopId,
  venueId,
  venueName,
  onCaptureStart,
  onReaction,
  onNote,
  disabled = false,
  className,
}: CaptureToolbarProps) {
  const [showReactions, setShowReactions] = useState(false)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [noteText, setNoteText] = useState("")

  const handleReaction = (emoji: string) => {
    onReaction?.(emoji)
    setShowReactions(false)
  }

  const handleNoteSubmit = () => {
    if (noteText.trim()) {
      onNote?.(noteText.trim())
      setNoteText("")
      setShowNoteInput(false)
    }
  }

  return (
    <div className={cn("relative", className)}>
      {/* Quick Reactions Popup */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg px-2 py-1.5 flex gap-1"
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 rounded-full transition-colors"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setShowReactions(false)}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note Input Popup */}
      <AnimatePresence>
        {showNoteInput && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-full mb-3 left-4 right-4 bg-white rounded-2xl shadow-lg p-3"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a quick note..."
                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNoteSubmit()
                  if (e.key === "Escape") setShowNoteInput(false)
                }}
              />
              <Button
                size="sm"
                onClick={handleNoteSubmit}
                disabled={!noteText.trim()}
                className="bg-[#1B4D3E] hover:bg-[#163d32]"
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNoteInput(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toolbar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/95 backdrop-blur-sm rounded-full shadow-lg px-2 py-2 flex items-center gap-1"
      >
        {/* Photo Button */}
        <ToolbarButton
          icon={Camera}
          label="Photo"
          onClick={() => onCaptureStart("photo")}
          disabled={disabled}
          color="bg-blue-500 hover:bg-blue-600"
        />

        {/* Voice Button */}
        <ToolbarButton
          icon={Mic}
          label="Voice"
          onClick={() => onCaptureStart("voice_note")}
          disabled={disabled}
          color="bg-red-500 hover:bg-red-600"
        />

        {/* Reaction Button */}
        <ToolbarButton
          icon={Smile}
          label="React"
          onClick={() => {
            setShowReactions(!showReactions)
            setShowNoteInput(false)
          }}
          disabled={disabled}
          active={showReactions}
          color="bg-amber-500 hover:bg-amber-600"
        />

        {/* Note Button */}
        <ToolbarButton
          icon={MessageSquare}
          label="Note"
          onClick={() => {
            setShowNoteInput(!showNoteInput)
            setShowReactions(false)
          }}
          disabled={disabled}
          active={showNoteInput}
          color="bg-purple-500 hover:bg-purple-600"
        />
      </motion.div>
    </div>
  )
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
  color: string
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
  color,
}: ToolbarButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center w-16 h-16 rounded-full text-white transition-all",
        color,
        disabled && "opacity-50 cursor-not-allowed",
        active && "ring-2 ring-offset-2 ring-gray-400"
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-medium mt-0.5">{label}</span>
    </motion.button>
  )
}
