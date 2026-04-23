/// <reference lib="WebWorker" />
import { cleanupOutdatedCaches, precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// SPA shell: intercept all navigation requests (full-page load / reload) and
// serve the cached index.html instead of hitting the network.  This prevents
// Nginx 502/503 "Bad Gateway" pages when the backend is temporarily down.
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

self.skipWaiting()
self.addEventListener('activate', (event) => {
  event.waitUntil((self as unknown as { clients: { claim(): Promise<void> } }).clients.claim())
})

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {}
  const title: string = data.title ?? 'ListMe'
  const body: string = data.body ?? ''
  const url: string = data.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // App is visible in a tab — the WS in-app toast already handles it
      const appVisible = (clients as WindowClient[]).some(c => c.visibilityState === 'visible')
      if (appVisible) return
      return self.registration.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-64x64.png',
        tag: 'listme-' + (data.url ?? 'general'),
        renotify: true,
        data: { url },
      } as NotificationOptions)
    }),
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url: string = (event.notification.data as { url?: string })?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
