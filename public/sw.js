// Service Worker for Conrad Tulum Companion App
const CACHE_NAME = "conrad-tulum-v1"
const OFFLINE_URL = "/offline"

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
]

// Cache strategies
const CACHE_STRATEGIES = {
  // Network first, fall back to cache
  networkFirst: async (request) => {
    try {
      const networkResponse = await fetch(request)
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME)
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    } catch (error) {
      const cachedResponse = await caches.match(request)
      return cachedResponse || caches.match(OFFLINE_URL)
    }
  },

  // Cache first, fall back to network
  cacheFirst: async (request) => {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) return cachedResponse

    try {
      const networkResponse = await fetch(request)
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME)
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    } catch (error) {
      return caches.match(OFFLINE_URL)
    }
  },

  // Stale while revalidate
  staleWhileRevalidate: async (request) => {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)

    const fetchPromise = fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    }).catch(() => cachedResponse)

    return cachedResponse || fetchPromise
  },
}

// Install event - precache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - handle requests
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") return

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith("http")) return

  // API requests - network first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request))
    return
  }

  // Static assets (images, fonts, etc.) - cache first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/)
  ) {
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request))
    return
  }

  // JS and CSS - stale while revalidate
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request))
    return
  }

  // HTML pages - network first
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request))
    return
  }

  // Default - network first
  event.respondWith(CACHE_STRATEGIES.networkFirst(request))
})

// Background sync for offline captures
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-captures") {
    event.waitUntil(syncPendingCaptures())
  }
})

async function syncPendingCaptures() {
  // Get pending captures from IndexedDB
  const db = await openCapturesDB()
  const tx = db.transaction("pending-captures", "readonly")
  const store = tx.objectStore("pending-captures")
  const captures = await store.getAll()

  for (const capture of captures) {
    try {
      // Upload capture
      const response = await fetch("/api/captures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(capture),
      })

      if (response.ok) {
        // Remove from pending
        const deleteTx = db.transaction("pending-captures", "readwrite")
        const deleteStore = deleteTx.objectStore("pending-captures")
        await deleteStore.delete(capture.id)
      }
    } catch (error) {
      console.error("Failed to sync capture:", error)
    }
  }
}

function openCapturesDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("conrad-tulum-captures", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains("pending-captures")) {
        db.createObjectStore("pending-captures", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("cached-venues")) {
        db.createObjectStore("cached-venues", { keyPath: "id" })
      }
    }
  })
}

// Push notification handler (for future use)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/",
      },
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && "focus" in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url)
      }
    })
  )
})
