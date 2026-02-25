// Service Worker for offline support
const CACHE_NAME = 'vehicle-scanner-v1'
const RUNTIME_CACHE = 'vehicle-scanner-runtime'

// Assets to cache immediately on install
const PRECACHE_URLS = [
   '/',
   '/index.html',
   '/404.html',
   '/manifest.json'
]

// Install event - cache critical assets
self.addEventListener('install', (event) => {
   console.log('[SW] Install event')
   event.waitUntil(
      caches.open(CACHE_NAME)
         .then(cache => {
            console.log('[SW] Precaching assets')
            return cache.addAll(PRECACHE_URLS)
         })
         .then(() => self.skipWaiting())
   )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
   console.log('[SW] Activate event')
   event.waitUntil(
      caches.keys()
         .then(cacheNames => {
            return Promise.all(
               cacheNames
                  .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                  .map(name => {
                     console.log('[SW] Deleting old cache:', name)
                     return caches.delete(name)
                  })
            )
         })
         .then(() => self.clients.claim())
   )
})

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
   const { request } = event
   const url = new URL(request.url)

   // Skip cross-origin requests
   if (url.origin !== location.origin) {
      return
   }

   // For navigation requests, use network-first strategy
   if (request.mode === 'navigate') {
      event.respondWith(
         fetch(request)
            .then(response => {
               // Cache successful responses
               if (response && response.status === 200) {
                  const responseClone = response.clone()
                  caches.open(RUNTIME_CACHE).then(cache => {
                     cache.put(request, responseClone)
                  })
               }
               return response
            })
            .catch(() => {
               // Fallback to cache if network fails
               return caches.match(request)
                  .then(cachedResponse => {
                     if (cachedResponse) {
                        return cachedResponse
                     }
                     // Return offline page if available
                     return caches.match('/index.html')
                  })
            })
      )
      return
   }

   // For other requests, use cache-first strategy
   event.respondWith(
      caches.match(request)
         .then(cachedResponse => {
            if (cachedResponse) {
               return cachedResponse
            }

            return fetch(request)
               .then(response => {
                  // Don't cache non-successful responses
                  if (!response || response.status !== 200 || response.type === 'error') {
                     return response
                  }

                  // Clone and cache the response
                  const responseClone = response.clone()
                  caches.open(RUNTIME_CACHE).then(cache => {
                     cache.put(request, responseClone)
                  })

                  return response
               })
         })
   )
})

// Message event - for communication with clients
self.addEventListener('message', (event) => {
   if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting()
   }

   if (event.data && event.data.type === 'CLEAR_CACHE') {
      event.waitUntil(
         caches.keys().then(cacheNames => {
            return Promise.all(
               cacheNames.map(name => caches.delete(name))
            )
         })
      )
   }
})
