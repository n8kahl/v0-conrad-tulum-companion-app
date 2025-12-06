"use client"

import { useState, useCallback } from "react"
import { useLanguage } from "@/lib/contexts/language-context"
import { shareContent, type ShareData } from "@/lib/sharing/share-utils"
import { Button } from "@/components/ui/button"
import { Share2, Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface ShareButtonProps {
  title: string
  text?: string
  url: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showLabel?: boolean
}

export function ShareButton({
  title,
  text,
  url,
  variant = "outline",
  size = "sm",
  className,
  showLabel = true,
}: ShareButtonProps) {
  const { t } = useLanguage()
  const [status, setStatus] = useState<"idle" | "copied" | "shared">("idle")

  const handleShare = useCallback(async () => {
    const data: ShareData = { title, text, url }
    const result = await shareContent(data)

    if (result.success) {
      setStatus(result.method === "native" ? "shared" : "copied")
      setTimeout(() => setStatus("idle"), 2000)
    }
  }, [title, text, url])

  const getIcon = () => {
    if (status === "copied") return <Check className="h-4 w-4 text-green-500" />
    if (status === "shared") return <Check className="h-4 w-4 text-green-500" />
    return <Share2 className="h-4 w-4" />
  }

  const getLabel = () => {
    if (status === "copied") return t("copied")
    if (status === "shared") return t("shared") || t("copied")
    return t("share")
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={cn("gap-2", className)}
    >
      {getIcon()}
      {showLabel && <span>{getLabel()}</span>}
    </Button>
  )
}
