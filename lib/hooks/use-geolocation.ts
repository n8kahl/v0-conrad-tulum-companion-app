"use client"

import { useState, useCallback, useEffect, useRef } from "react"

interface GeolocationPosition {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watchPosition?: boolean
}

interface UseGeolocationReturn {
  isSupported: boolean
  isLoading: boolean
  position: GeolocationPosition | null
  error: string | null
  getPosition: () => Promise<GeolocationPosition | null>
  clearPosition: () => void
}

export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watchPosition = false,
  } = options

  const watchIdRef = useRef<number | null>(null)

  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check for support on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    setIsSupported("geolocation" in navigator)
  }, [])

  const handleSuccess = useCallback((pos: globalThis.GeolocationPosition) => {
    setPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
    })
    setError(null)
    setIsLoading(false)
  }, [])

  const handleError = useCallback((err: GeolocationPositionError) => {
    let message: string

    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = "Location permission denied. Please enable location access."
        break
      case err.POSITION_UNAVAILABLE:
        message = "Location information unavailable."
        break
      case err.TIMEOUT:
        message = "Location request timed out."
        break
      default:
        message = "An unknown error occurred getting location."
    }

    setError(message)
    setIsLoading(false)
  }, [])

  const getPosition = useCallback(async (): Promise<GeolocationPosition | null> => {
    if (!isSupported) {
      setError("Geolocation not supported on this device")
      return null
    }

    setIsLoading(true)
    setError(null)

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          }
          setPosition(result)
          setError(null)
          setIsLoading(false)
          resolve(result)
        },
        (err) => {
          handleError(err)
          resolve(null)
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      )
    })
  }, [isSupported, enableHighAccuracy, timeout, maximumAge, handleError])

  const clearPosition = useCallback(() => {
    setPosition(null)
    setError(null)
  }, [])

  // Set up watch position if enabled
  useEffect(() => {
    if (!isSupported || !watchPosition) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [
    isSupported,
    watchPosition,
    enableHighAccuracy,
    timeout,
    maximumAge,
    handleSuccess,
    handleError,
  ])

  return {
    isSupported,
    isLoading,
    position,
    error,
    getPosition,
    clearPosition,
  }
}
