"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WifiOff, Cloud, CloudOff, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useOffline } from "@/lib/hooks/use-offline"
import { cn } from "@/lib/utils"

interface OfflineIndicatorProps {
  className?: string
  showSyncButton?: boolean
  compact?: boolean
}

export function OfflineIndicator({
  className,
  showSyncButton = true,
  compact = false,
}: OfflineIndicatorProps) {
  const {
    isOnline,
    pendingCount,
    syncPendingCaptures,
    lastSyncTime,
  } = useOffline()

  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncPendingCaptures()
    } finally {
      setIsSyncing(false)
    }
  }

  if (compact) {
    return (
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn("inline-flex items-center gap-1.5", className)}
          >
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" />
              Offline
            </Badge>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Cloud className="h-3 w-3" />
                {pendingCount} pending
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {(!isOnline || pendingCount > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            "flex items-center justify-between gap-4 px-4 py-2 rounded-lg",
            isOnline ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200",
            className
          )}
        >
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Cloud className="h-5 w-5 text-amber-600" />
            ) : (
              <CloudOff className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className={cn("text-sm font-medium", isOnline ? "text-amber-800" : "text-red-800")}>
                {isOnline ? "Syncing required" : "You're offline"}
              </p>
              <p className={cn("text-xs", isOnline ? "text-amber-600" : "text-red-600")}>
                {pendingCount > 0
                  ? `${pendingCount} capture${pendingCount === 1 ? "" : "s"} waiting to sync`
                  : "Changes will sync when online"}
                {lastSyncTime && isOnline && (
                  <> • Last sync: {lastSyncTime.toLocaleTimeString()}</>
                )}
              </p>
            </div>
          </div>

          {showSyncButton && isOnline && pendingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="shrink-0"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Sync Now
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
