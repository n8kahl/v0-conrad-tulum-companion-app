"use client"

import { useState, useEffect, useCallback } from "react"

interface PendingCapture {
  id: string
  visitStopId: string
  captureType: "photo" | "voice_note"
  storagePath: string
  caption?: string
  transcript?: string
  sentiment?: string
  location?: { lat: number; lng: number }
  capturedBy: "sales" | "client"
  timestamp: number
}

interface UseOfflineReturn {
  isOnline: boolean
  isServiceWorkerReady: boolean
  pendingCount: number
  queueCapture: (capture: Omit<PendingCapture, "id" | "timestamp">) => Promise<void>
  syncPendingCaptures: () => Promise<void>
  getCachedVenueData: (venueId: string) => Promise<unknown | null>
  cacheVenueData: (venueId: string, data: unknown) => Promise<void>
  lastSyncTime: Date | null
}

const DB_NAME = "conrad-tulum-captures"
const DB_VERSION = 1

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains("pending-captures")) {
        db.createObjectStore("pending-captures", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("cached-venues")) {
        db.createObjectStore("cached-venues", { keyPath: "id" })
      }
    }
  })
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(true)
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Check online status
  useEffect(() => {
    if (typeof window === "undefined") return

    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Trigger sync when coming back online
      syncPendingCaptures()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Register service worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration.scope)
        setIsServiceWorkerReady(true)
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error)
      })
  }, [])

  // Load pending count on mount
  useEffect(() => {
    loadPendingCount()
  }, [])

  const loadPendingCount = useCallback(async () => {
    if (typeof indexedDB === "undefined") return

    try {
      const db = await openDatabase()
      const tx = db.transaction("pending-captures", "readonly")
      const store = tx.objectStore("pending-captures")
      const countRequest = store.count()

      countRequest.onsuccess = () => {
        setPendingCount(countRequest.result)
      }
    } catch (error) {
      console.error("Failed to load pending count:", error)
    }
  }, [])

  const queueCapture = useCallback(
    async (capture: Omit<PendingCapture, "id" | "timestamp">) => {
      if (typeof indexedDB === "undefined") return

      try {
        const db = await openDatabase()
        const tx = db.transaction("pending-captures", "readwrite")
        const store = tx.objectStore("pending-captures")

        const captureWithId: PendingCapture = {
          ...capture,
          id: `capture-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: Date.now(),
        }

        await new Promise<void>((resolve, reject) => {
          const request = store.add(captureWithId)
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })

        setPendingCount((prev) => prev + 1)

        // Request background sync if available
        if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
          const registration = await navigator.serviceWorker.ready
          await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register("sync-captures")
        }
      } catch (error) {
        console.error("Failed to queue capture:", error)
        throw error
      }
    },
    []
  )

  const syncPendingCaptures = useCallback(async () => {
    if (typeof indexedDB === "undefined" || !isOnline) return

    try {
      const db = await openDatabase()
      const tx = db.transaction("pending-captures", "readonly")
      const store = tx.objectStore("pending-captures")

      const captures = await new Promise<PendingCapture[]>((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      for (const capture of captures) {
        try {
          const response = await fetch("/api/captures", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              visitStopId: capture.visitStopId,
              captureType: capture.captureType,
              storagePath: capture.storagePath,
              caption: capture.caption,
              transcript: capture.transcript,
              sentiment: capture.sentiment,
              location: capture.location,
              capturedBy: capture.capturedBy,
            }),
          })

          if (response.ok) {
            // Remove from pending
            const deleteTx = db.transaction("pending-captures", "readwrite")
            const deleteStore = deleteTx.objectStore("pending-captures")
            await new Promise<void>((resolve, reject) => {
              const request = deleteStore.delete(capture.id)
              request.onsuccess = () => resolve()
              request.onerror = () => reject(request.error)
            })
            setPendingCount((prev) => Math.max(0, prev - 1))
          }
        } catch (error) {
          console.error("Failed to sync capture:", capture.id, error)
        }
      }

      setLastSyncTime(new Date())
    } catch (error) {
      console.error("Failed to sync pending captures:", error)
    }
  }, [isOnline])

  const getCachedVenueData = useCallback(async (venueId: string): Promise<unknown | null> => {
    if (typeof indexedDB === "undefined") return null

    try {
      const db = await openDatabase()
      const tx = db.transaction("cached-venues", "readonly")
      const store = tx.objectStore("cached-venues")

      return new Promise((resolve, reject) => {
        const request = store.get(venueId)
        request.onsuccess = () => resolve(request.result?.data || null)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("Failed to get cached venue:", error)
      return null
    }
  }, [])

  const cacheVenueData = useCallback(async (venueId: string, data: unknown) => {
    if (typeof indexedDB === "undefined") return

    try {
      const db = await openDatabase()
      const tx = db.transaction("cached-venues", "readwrite")
      const store = tx.objectStore("cached-venues")

      await new Promise<void>((resolve, reject) => {
        const request = store.put({ id: venueId, data, cachedAt: Date.now() })
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error("Failed to cache venue data:", error)
    }
  }, [])

  return {
    isOnline,
    isServiceWorkerReady,
    pendingCount,
    queueCapture,
    syncPendingCaptures,
    getCachedVenueData,
    cacheVenueData,
    lastSyncTime,
  }
}
