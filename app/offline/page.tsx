"use client"

import { useEffect, useState } from "react"
import { WifiOff, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleRetry = () => {
    window.location.reload()
  }

  if (isOnline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">You're back online!</h1>
          <p className="text-muted-foreground mb-6">
            Your connection has been restored. Click below to continue.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Link>
            </Button>
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">You're offline</h1>
        <p className="text-muted-foreground mb-6">
          It looks like you've lost your internet connection. Don't worry - any captures you've made are saved locally and will sync when you're back online.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-medium mb-2">What you can still do:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• View cached venue information</li>
            <li>• Take photos and voice notes</li>
            <li>• Add notes and reactions</li>
            <li>• All data will sync automatically</li>
          </ul>
        </div>
        <Button onClick={handleRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>

      <div className="absolute bottom-6 text-center text-sm text-muted-foreground">
        <p>Conrad Tulum Companion</p>
      </div>
    </div>
  )
}
